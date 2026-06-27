/* =========================================================================
   CONFIG.JS — Hier pas je je bedrijfsgegevens, teksten en standaardprijzen aan
   ========================================================================= 
   Dit is het ENIGE bestand dat je meestal nodig hebt om aan te passen.
   Na het aanpassen: sla op en herstart de server (zie README.md).
   ========================================================================= */

module.exports = {
  bedrijf: {
    naam: "Don Vloeren",
    straat: "Hogendijk 26",
    postcodePlaats: "4681 RM Nieuw-Vossemeer",
    telefoon: "06 4006 1130",
    email: "Martin@donvloeren.nl",
    website: "www.donvloeren.nl",
    iban: "NL37 KNAB 0615 6689 09",
    kvk: "90218760",
    btwNummer: "NL004798552B27",
    logoPad: "/images/logo.png", // logo bestand staat in public/images/logo.png
  },

  // BTW percentage (21 = 21%)
  btwPercentage: 21,

  // Standaard prijs per eenheid die in het formulier wordt voorgevuld
  // wanneer er nog geen "soort werk" gekozen is.
  standaardPrijsPerM2: 15.0,

  // Lijst met soorten werk, elk met hun eigen prijs en eenheid.
  // Zodra de gebruiker een soort werk kiest in het formulier, wordt de
  // prijs en eenheid automatisch ingevuld.
  //
  // - naam: wat er in de dropdown en op de offerte/factuur komt te staan
  // - prijs: de prijs per eenheid, excl. btw
  // - eenheid: "m²" (vloeroppervlak), "m¹" (strekkende meter, bijv. plinten),
  //            of "stuk" (bijv. per traptrede)
  //
  // Voeg hier gerust extra regels toe, verwijder regels, of pas prijzen aan.
  soortenWerk: [
    { naam: "Egaliseren 4mm", prijs: 15.0, eenheid: "m²" },
    { naam: "Egaliseren 8mm", prijs: 30.0, eenheid: "m²" },
    { naam: "Plinten plaatsen", prijs: 6.0, eenheid: "m¹" },
    { naam: "PVC stroken plakken", prijs: 10.0, eenheid: "m²" },
    { naam: "PVC visgraat plakken", prijs: 15.0, eenheid: "m²" },
    { naam: "PVC tegels plakken", prijs: 12.5, eenheid: "m²" },
    { naam: "Trap PVC", prijs: 110.0, eenheid: "stuk" },
  ],

  // Tekst die onderaan de offerte verschijnt
  offerteVoorwaarden: [
    "Deze offerte is vrijblijvend en 30 dagen geldig.",
    "Prijzen zijn excl. btw, tenzij anders vermeld.",
    "Op al onze leveringen en werkzaamheden zijn onze algemene voorwaarden van toepassing.",
    "Deze zijn op aanvraag beschikbaar.",
  ],

  // Tekst die onderaan de factuur verschijnt
  factuurVoorwaarden: [
    "Gelieve het totaalbedrag binnen 14 dagen na factuurdatum te voldoen.",
    "Vermeld bij betaling altijd het factuurnummer.",
    "Op al onze leveringen en werkzaamheden zijn onze algemene voorwaarden van toepassing.",
  ],

  // Aantal dagen dat een offerte geldig is (voor "Geldig tot" datum)
  offerteGeldigheidDagen: 30,

  // Aantal dagen betaaltermijn voor een factuur (voor "Vervaldatum")
  factuurBetaaltermijnDagen: 14,

  // Voorvoegsel + startnummer voor offertenummers en factuurnummers
  // Het volgnummer wordt automatisch opgehoogd en bijgehouden in data/teller.json
  offertenummerVoorvoegsel: "OFF-",
  factuurnummerVoorvoegsel: "FACT-",
  startjaar: new Date().getFullYear(),
};
