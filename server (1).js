const express = require("express");
const path = require("path");
const crypto = require("crypto");
const config = require("./config");
const storage = require("./storage");
const { berekenTotalen } = require("./berekeningen");
const { renderDocumentHtml } = require("./document-template");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (req, res) => {
  res.json({ soortenWerk: config.soortenWerk, standaardPrijsPerM2: config.standaardPrijsPerM2, bedrijfsnaam: config.bedrijf.naam, eenheden: config.eenheden });
});

app.get("/api/volgend-offertenummer", (req, res) => {
  const teller = storage.leesToeller();
  const volgendNummer = (teller.offerte || 0) + 1;
  const nummer = `${config.offertenummerVoorvoegsel}${config.startjaar}-${String(volgendNummer).padStart(4, "0")}`;
  res.json({ nummer });
});

app.get("/api/check-offertenummer/:nummer", (req, res) => {
  res.json({ bestaatAl: storage.offertenummerBestaatAl(req.params.nummer.trim()) });
});

app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "public", "index.html")); });

app.post("/offerte/nieuw", (req, res) => {
  const body = req.body;
  const klant = { naam: body.klantNaam || "", adres: body.klantAdres || "", postcode: body.klantPostcode || "", plaats: body.klantPlaats || "", telefoon: body.klantTelefoon || "", email: body.klantEmail || "" };
  const opmerkingen = body.opmerkingen || "";
  const btwVerlegd = body.btwVerlegd === "1";

  let regels = [];
  try {
    const ruweRegels = JSON.parse(body.werkRegelsJson || "[]");
    regels = ruweRegels
      .map((r) => ({ omschrijving: (r.omschrijving || "").trim(), aantal: Number(r.aantal) || 0, eenheid: r.eenheid || "stuk", prijsPerEenheid: Number(r.prijsPerEenheid) || 0 }))
      .filter((r) => r.omschrijving || r.aantal || r.prijsPerEenheid);
  } catch (e) { console.error("werkRegelsJson fout:", e); }

  const berekening = berekenTotalen(regels, btwVerlegd);

  let offertenummer;
  const handmatigNummer = (body.offertenummer || "").trim();
  if (handmatigNummer) {
    if (storage.offertenummerBestaatAl(handmatigNummer)) {
      return res.redirect(`/?fout=duplicate&nummer=${encodeURIComponent(handmatigNummer)}`);
    }
    offertenummer = handmatigNummer;
  } else {
    const volgnummer = storage.volgendNummer("offerte");
    offertenummer = `${config.offertenummerVoorvoegsel}${config.startjaar}-${String(volgnummer).padStart(4, "0")}`;
  }

  const vandaag = new Date();
  const geldigTot = new Date(vandaag);
  geldigTot.setDate(geldigTot.getDate() + config.offerteGeldigheidDagen);

  const record = { id: crypto.randomUUID(), status: "offerte", offertenummer, aangemaaktOp: vandaag.toISOString(), geldigTot: geldigTot.toISOString(), klant, klus: { opmerkingen }, berekening, factuurnummer: null, factuurdatum: null, vervaldatum: null };
  storage.voegOfferteToe(record);
  res.redirect(`/offerte/${record.id}`);
});

app.get("/offerte/:id", (req, res) => {
  const record = storage.vindOfferteOpId(req.params.id);
  if (!record) return res.status(404).send("Offerte niet gevonden.");
  res.send(renderDocumentHtml(record, record.status === "factuur" ? "factuur" : "offerte"));
});

app.post("/offerte/:id/akkoord", (req, res) => {
  const record = storage.vindOfferteOpId(req.params.id);
  if (!record) return res.status(404).send("Offerte niet gevonden.");
  if (record.status !== "factuur") {
    const vandaag = new Date();
    const vervaldatum = new Date(vandaag);
    vervaldatum.setDate(vervaldatum.getDate() + config.factuurBetaaltermijnDagen);
    const volgnummer = storage.volgendNummer("factuur");
    const factuurnummer = `${config.factuurnummerVoorvoegsel}${config.startjaar}-${String(volgnummer).padStart(4, "0")}`;
    storage.updateOfferte(record.id, { status: "factuur", factuurnummer, factuurdatum: vandaag.toISOString(), vervaldatum: vervaldatum.toISOString() });
  }
  res.redirect(`/offerte/${record.id}`);
});

function escapeHtml(t) { if (!t) return ""; return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

app.get("/overzicht", (req, res) => {
  const lijst = storage.leesAlleOffertes().slice().reverse();
  const rijenHtml = lijst.map((r) => {
    const nummer = r.status === "factuur" ? r.factuurnummer : r.offertenummer;
    return `<tr><td>${escapeHtml(nummer)}</td><td>${escapeHtml(r.klant.naam)}</td><td>${r.status === "factuur" ? "Factuur" : "Offerte"}</td><td><a href="/offerte/${r.id}">Openen →</a></td></tr>`;
  }).join("");
  res.send(`<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"/><title>Overzicht — ${config.bedrijf.naam}</title><link rel="stylesheet" href="/css/stijl.css"/><link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32.png"/></head><body class="overzicht-pagina"><div class="overzicht-vel"><h1>Overzicht offertes &amp; facturen</h1><a href="/" class="btn btn-outline">&larr; Nieuwe offerte maken</a><table class="overzicht-tabel"><thead><tr><th>Nummer</th><th>Klant</th><th>Status</th><th></th></tr></thead><tbody>${rijenHtml || '<tr><td colspan="4">Nog geen offertes.</td></tr>'}</tbody></table></div></body></html>`);
});

app.listen(PORT, () => { console.log(`==========================================\n ${config.bedrijf.naam} — Server draait op poort ${PORT}\n==========================================`); });
