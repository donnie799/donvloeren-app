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

  // Standaard prijs per eenheid die als basis dient wanneer er nog geen
  // werkzaamheid gekozen is bij het toevoegen van een nieuwe rij.
  standaardPrijsPerM2: 15.0,

  // ===========================================================================
  // WERKZAAMHEDEN-PRIJSLIJST
  // ===========================================================================
  // Dit is dé bron van waarheid voor al je standaardprijzen. Bij het kiezen
  // van een werkzaamheid in de calculatietabel wordt de prijs hieruit
  // automatisch ingevuld. De gebruiker kan de prijs per offerte nog
  // handmatig aanpassen — dat verandert NOOIT de prijs hier in dit bestand.
  //
  // - naam: wat er in de keuzelijst en op de offerte/factuur komt te staan
  // - prijs: de standaard prijs per eenheid, excl. btw
  // - eenheid: moet één van de waarden uit `eenheden` hieronder zijn
  //
  // BELANGRIJK — bestaande prijzen (de eerste 7 regels) zijn ongewijzigd
  // overgenomen uit het vorige systeem. De overige regels zijn toegevoegd
  // op verzoek maar hebben prijs 0 omdat er geen bestaande prijs voor was —
  // vul deze hieronder zelf aan met de juiste prijs.
  soortenWerk: [
    // ---- Bestaande werkzaamheden (prijzen ongewijzigd overgenomen) ----
    { naam: "Egaliseren 4mm", prijs: 15.0, eenheid: "m²" },
    { naam: "Egaliseren 8mm", prijs: 30.0, eenheid: "m²" },
    { naam: "Plinten plaatsen", prijs: 6.0, eenheid: "m¹" },
    { naam: "PVC stroken plakken", prijs: 10.0, eenheid: "m²" },
    { naam: "PVC visgraat plakken", prijs: 15.0, eenheid: "m²" },
    { naam: "PVC tegels plakken", prijs: 12.5, eenheid: "m²" },
    { naam: "Trap PVC", prijs: 110.0, eenheid: "stuk" },

    // ---- Nieuw toegevoegd op verzoek — VUL ZELF DE JUISTE PRIJS IN ----
    { naam: "Egaliseren 3mm", prijs: 0, eenheid: "m²" },
    { naam: "Egaliseren 5mm", prijs: 0, eenheid: "m²" },
    { naam: "Egaliseren 6mm", prijs: 0, eenheid: "m²" },
    { naam: "Hongaarse punt", prijs: 0, eenheid: "m²" },
    { naam: "Laminaat leggen", prijs: 0, eenheid: "m²" },
    { naam: "Ondervloer plaatsen", prijs: 0, eenheid: "m²" },
    { naam: "Hoge MDF plinten", prijs: 0, eenheid: "m¹" },
    { naam: "Plakplinten", prijs: 0, eenheid: "m¹" },
    { naam: "Kitten", prijs: 0, eenheid: "m¹" },
    { naam: "Oude vloer verwijderen", prijs: 0, eenheid: "m²" },
    { naam: "Tapijt verwijderen", prijs: 0, eenheid: "m²" },
    { naam: "Verlijmd PVC verwijderen", prijs: 0, eenheid: "m²" },
    { naam: "Fermacell leggen", prijs: 0, eenheid: "m²" },
    { naam: "Vloerverwarming", prijs: 0, eenheid: "m²" },
    { naam: "Traprenovatie", prijs: 0, eenheid: "stuk" },
  ],

  // Beschikbare eenheden in de keuzelijst per regel van de calculatietabel.
  // "Vrije invoer" laat de gebruiker zelf tekst typen (bijv. "set", "rol").
  eenheden: ["m²", "m¹", "stuk", "uur", "dag", "zak", "emmer", "pallet", "vrije invoer"],

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
