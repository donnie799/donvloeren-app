/* =========================================================================
   SERVER.JS — De hoofdserver van de webapp
   =========================================================================
   Dit bestand start de webserver en regelt alle pagina's en acties:
   - Het formulier tonen (home page)
   - Een nieuwe offerte aanmaken vanuit het formulier
   - Een offerte tonen
   - Een offerte "akkoord" geven -> wordt automatisch een factuur
   - Een factuur tonen

   Lees README.md voor uitleg hoe je dit lokaal start.
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

// Maakt het mogelijk om formulierdata (POST) te lezen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Alles in de map "public" is direct toegankelijk (css, js, logo)
app.use(express.static(path.join(__dirname, "public")));

// Stuur het bedrijfsconfig + standaardwaarden mee naar de browser,
// zodat het formulier de juiste dropdown-opties en standaardprijs toont.
app.get("/api/config", (req, res) => {
  res.json({
    soortenWerk: config.soortenWerk,
    standaardPrijsPerM2: config.standaardPrijsPerM2,
    bedrijfsnaam: config.bedrijf.naam,
  });
});

// -------------------------------------------------------------------------
// HOME PAGINA — toont het formulier (zie public/index.html + public/js/formulier.js)
// -------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------------------------------------------------------
// NIEUWE OFFERTE AANMAKEN vanuit het formulier
// -------------------------------------------------------------------------
app.post("/offerte/nieuw", (req, res) => {
  const body = req.body;

  // Klantgegevens uit het formulier
  const klant = {
    naam: body.klantNaam || "",
    adres: body.klantAdres || "",
    postcode: body.klantPostcode || "",
    plaats: body.klantPlaats || "",
    telefoon: body.klantTelefoon || "",
    email: body.klantEmail || "",
  };

  // Klusinformatie uit het formulier
  const soortWerk = body.soortWerk || "";
  const aantalM2 = Number(body.aantalM2) || 0;
  const prijsPerM2 = Number(body.prijsPerM2) || 0;
  const eenheidHoofdwerk = body.eenheidHoofdwerk || "m²";
  const opmerkingen = body.opmerkingen || "";

  // Basisregel: het hoofdwerk (aantal x prijs per eenheid)
  const regels = [
    {
      omschrijving: soortWerk || "Vloerwerk",
      aantal: aantalM2,
      eenheid: eenheidHoofdwerk,
      prijsPerEenheid: prijsPerM2,
    },
  ];

  // Extra werkzaamheden: meerdere regels mogelijk, aangeleverd als arrays
  // vanuit het formulier (extraOmschrijving[], extraAantal[], extraPrijs[])
  const extraOmschrijvingen = toArray(body.extraOmschrijving);
  const extraAantallen = toArray(body.extraAantal);
  const extraPrijzen = toArray(body.extraPrijs);

  for (let i = 0; i < extraOmschrijvingen.length; i++) {
    const omschrijving = (extraOmschrijvingen[i] || "").trim();
    if (!omschrijving) continue; // sla lege regels over
    regels.push({
      omschrijving,
      aantal: Number(extraAantallen[i]) || 1,
      eenheid: "stuk",
      prijsPerEenheid: Number(extraPrijzen[i]) || 0,
    });
  }

  const berekening = berekenTotalen(regels);

  const vandaag = new Date();
  const geldigTot = new Date(vandaag);
  geldigTot.setDate(geldigTot.getDate() + config.offerteGeldigheidDagen);

  const volgnummer = storage.volgendNummer("offerte");
  const offertenummer = `${config.offertenummerVoorvoegsel}${config.startjaar}-${String(
    volgnummer
  ).padStart(4, "0")}`;

  const record = {
    id: crypto.randomUUID(),
    status: "offerte", // wordt "factuur" zodra klant akkoord geeft
    offertenummer,
    aangemaaktOp: vandaag.toISOString(),
    geldigTot: geldigTot.toISOString(),
    klant,
    klus: { soortWerk, aantalM2, prijsPerM2, opmerkingen },
    berekening,
    // Factuur-velden worden pas gevuld bij akkoord:
    factuurnummer: null,
    factuurdatum: null,
    vervaldatum: null,
  };

  storage.voegOfferteToe(record);

  res.redirect(`/offerte/${record.id}`);
});

// Helper: zet een enkele waarde of array altijd om naar een array
function toArray(waarde) {
  if (waarde === undefined || waarde === null) return [];
  return Array.isArray(waarde) ? waarde : [waarde];
}

// -------------------------------------------------------------------------
// OFFERTE OF FACTUUR TONEN
// -------------------------------------------------------------------------
app.get("/offerte/:id", (req, res) => {
  const record = storage.vindOfferteOpId(req.params.id);
  if (!record) {
    return res.status(404).send("Offerte niet gevonden.");
  }
  const modus = record.status === "factuur" ? "factuur" : "offerte";
  const html = renderDocumentHtml(record, modus);
  res.send(html);
});

// -------------------------------------------------------------------------
// AKKOORD GEVEN -> offerte wordt automatisch een factuur
// -------------------------------------------------------------------------
app.post("/offerte/:id/akkoord", (req, res) => {
  const record = storage.vindOfferteOpId(req.params.id);
  if (!record) {
    return res.status(404).send("Offerte niet gevonden.");
  }

  if (record.status !== "factuur") {
    const vandaag = new Date();
    const vervaldatum = new Date(vandaag);
    vervaldatum.setDate(vervaldatum.getDate() + config.factuurBetaaltermijnDagen);

    const volgnummer = storage.volgendNummer("factuur");
    const factuurnummer = `${config.factuurnummerVoorvoegsel}${config.startjaar}-${String(
      volgnummer
    ).padStart(4, "0")}`;

    storage.updateOfferte(record.id, {
      status: "factuur",
      factuurnummer,
      factuurdatum: vandaag.toISOString(),
      vervaldatum: vervaldatum.toISOString(),
    });
  }

  res.redirect(`/offerte/${record.id}`);
});

// Kleine helper om tekst veilig in HTML te tonen (voorkomt opmaakproblemen
// als een klantnaam toevallig tekens als < of > bevat)
function escapeHtml(tekst) {
  if (tekst === undefined || tekst === null) return "";
  return String(tekst)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------------------------------------------------------------------------
// OVERZICHT van alle offertes/facturen (handig om terug te vinden)
// -------------------------------------------------------------------------
app.get("/overzicht", (req, res) => {
  const lijst = storage.leesAlleOffertes().slice().reverse();
  const rijenHtml = lijst
    .map((r) => {
      const nummer =
        r.status === "factuur" ? r.factuurnummer : r.offertenummer;
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
