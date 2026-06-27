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
  const geldigTot
