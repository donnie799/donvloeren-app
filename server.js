/* =========================================================================
   SERVER.JS — De hoofdserver van de webapp
   ========================================================================= */

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

// -------------------------------------------------------------------------
// CONFIG API — werkzaamheden, eenheden, standaardprijzen
// -------------------------------------------------------------------------
app.get("/api/config", (req, res) => {
  res.json({
    soortenWerk: config.soortenWerk,
    standaardPrijsPerM2: config.standaardPrijsPerM2,
    bedrijfsnaam: config.bedrijf.naam,
    eenheden: config.eenheden,
  });
});

// -------------------------------------------------------------------------
// VOLGEND OFFERTENUMMER — geeft het eerstvolgende automatische nummer terug
// Wordt door het formulier gebruikt om het standaardnummer alvast in te vullen
// -------------------------------------------------------------------------
app.get("/api/volgend-offertenummer", (req, res) => {
  const teller = storage.leesToeller();
  const volgendNummer = (teller.offerte || 0) + 1;
  const nummer = `${config.offertenummerVoorvoegsel}${config.startjaar}-${String(volgendNummer).padStart(4, "0")}`;
  res.json({ nummer });
});

// -------------------------------------------------------------------------
// CHECK OFFERTENUMMER — controleert of een nummer al bestaat
// -------------------------------------------------------------------------
app.get("/api/check-offertenummer/:nummer", (req, res) => {
  const nummer = req.params.nummer.trim();
  const bestaatAl = storage.offertenummerBestaatAl(nummer);
  res.json({ bestaatAl });
});

// -------------------------------------------------------------------------
// HOME PAGINA
// -------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------------------------------------------------------
// NIEUWE OFFERTE AANMAKEN
// -------------------------------------------------------------------------
app.post("/offerte/nieuw", (req, res) => {
  const body = req.body;

  const klant = {
    naam: body.klantNaam || "",
    adres: body.klantAdres || "",
    postcode: body.klantPostcode || "",
    plaats: body.klantPlaats || "",
    telefoon: body.klantTelefoon || "",
    email: body.klantEmail || "",
  };

  const opmerkingen = body.opmerkingen || "";

  // Werkzaamheden uit de calculatietabel
  let regels = [];
  try {
    const ruweRegels = JSON.parse(body.werkRegelsJson || "[]");
    regels = ruweRegels
      .map((regel) => ({
        omschrijving: (regel.omschrijving || "").trim(),
        aantal: Number(regel.aantal) || 0,
        eenheid: regel.eenheid || "stuk",
        prijsPerEenheid: Number(regel.prijsPerEenheid) || 0,
      }))
      .filter((regel) => regel.omschrijving || regel.aantal || regel.prijsPerEenheid);
  } catch (fout) {
    console.error("Kon werkRegelsJson niet verwerken:", fout);
  }

  const berekening = berekenTotalen(regels);

  // ---- Offertenummer bepalen ----
  // Als de gebruiker een handmatig nummer heeft ingevuld, dat gebruiken.
  // Zo niet (leeg veld), automatisch het volgende nummer genereren.
  let offertenummer;
  const handmatigNummer = (body.offertenummer || "").trim();

  if (handmatigNummer) {
    // Controleer of het nummer al bestaat
    if (storage.offertenummerBestaatAl(handmatigNummer)) {
      // Stuur de gebruiker terug naar het formulier met een foutmelding
      return res.redirect(
        `/?fout=duplicate&nummer=${encodeURIComponent(handmatigNummer)}`
      );
    }
    offertenummer = handmatigNummer;
  } else {
    // Automatisch genereren en de teller ophogen
    const volgnummer = storage.volgendNummer("offerte");
    offertenummer = `${config.offertenummerVoorvoegsel}${config.startjaar}-${String(volgnummer).padStart(4, "0")}`;
  }

  const vandaag = new Date();
  const geldigTot = new Date(vandaag);
  geldigTot.setDate(geldigTot.getDate() + config.offerteGeldigheidDagen);

  const record = {
    id: crypto.randomUUID(),
    status: "offerte",
    offertenummer,
    aangemaaktOp: vandaag.toISOString(),
    geldigTot: geldigTot.toISOString(),
    klant,
    klus: { opmerkingen },
    berekening,
    factuurnummer: null,
    factuurdatum: null,
    vervaldatum: null,
  };

  storage.voegOfferteToe(record);
  res.redirect(`/offerte/${record.id}`);
});

// -------------------------------------------------------------------------
// OFFERTE OF FACTUUR TONEN
// -------------------------------------------------------------------------
app.get("/offerte/:id", (req, res) => {
  const record = storage.vindOfferteOpId(req.params.id);
  if (!record) return res.status(404).send("Offerte niet gevonden.");
  const modus = record.status === "factuur" ? "factuur" : "offerte";
  res.send(renderDocumentHtml(record, modus));
});

// -------------------------------------------------------------------------
// AKKOORD GEVEN → factuur
// -------------------------------------------------------------------------
app.post("/offerte/:id/akkoord", (req, res) => {
  const record = storage.vindOfferteOpId(req.params.id);
  if (!record) return res.status(404).send("Offerte niet gevonden.");

  if (record.status !== "factuur") {
    const vandaag = new Date();
    const vervaldatum = new Date(vandaag);
    vervaldatum.setDate(vervaldatum.getDate() + config.factuurBetaaltermijnDagen);

    const volgnummer = storage.volgendNummer("factuur");
    const factuurnummer = `${config.factuurnummerVoorvoegsel}${config.startjaar}-${String(volgnummer).padStart(4, "0")}`;

    storage.updateOfferte(record.id, {
      status: "factuur",
      factuurnummer,
      factuurdatum: vandaag.toISOString(),
      vervaldatum: vervaldatum.toISOString(),
    });
  }

  res.redirect(`/offerte/${record.id}`);
});

// -------------------------------------------------------------------------
// OVERZICHT
// -------------------------------------------------------------------------
function escapeHtml(tekst) {
  if (tekst === undefined || tekst === null) return "";
  return String(tekst)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

app.get("/overzicht", (req, res) => {
  const lijst = storage.leesAlleOffertes().slice().reverse();
  const rijenHtml = lijst
    .map((r) => {
      const nummer = r.status === "factuur" ? r.factuurnummer : r.offertenummer;
      const statusLabel = r.status === "factuur" ? "Factuur" : "Offerte";
      return `<tr>
        <td>${escapeHtml(nummer)}</td>
        <td>${escapeHtml(r.klant.naam)}</td>
        <td>${statusLabel}</td>
        <td><a href="/offerte/${r.id}">Openen →</a></td>
      </tr>`;
    })
    .join("");

  res.send(`<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8" />
<title>Overzicht — ${config.bedrijf.naam}</title>
<link rel="stylesheet" href="/css/stijl.css" />
<link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png" />
</head>
<body class="overzicht-pagina">
<div class="overzicht-vel">
  <h1>Overzicht offertes &amp; facturen</h1>
  <a href="/" class="btn btn-outline">&larr; Nieuwe offerte maken</a>
  <table class="overzicht-tabel">
    <thead><tr><th>Nummer</th><th>Klant</th><th>Status</th><th></th></tr></thead>
    <tbody>${rijenHtml || '<tr><td colspan="4">Nog geen offertes.</td></tr>'}</tbody>
  </table>
</div>
</body></html>`);
});

app.listen(PORT, () => {
  console.log("==========================================");
  console.log(` ${config.bedrijf.naam} — Offerte & Factuur app`);
  console.log(` Server draait op poort ${PORT}`);
  console.log("==========================================");
});
