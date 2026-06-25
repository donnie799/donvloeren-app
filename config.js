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

  // Standaard prijs per m² die in het formulier wordt voorgevuld.
  // De gebruiker (of jij) kan dit per offerte nog aanpassen in het formulier zelf.
  standaardPrijsPerM2: 45.0,

  // Lijst met veelvoorkomende "soort werk" opties in de dropdown.
  // Voeg hier gerust extra soorten werk toe of verwijder ze.
  soortenWerk: [
    "Egaliseren vloer",
    "Dekvloer storten",
    "Vloerverwarming aanleggen",
    "Renovatie bestaande vloer",
    "Anders / combinatie",
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
