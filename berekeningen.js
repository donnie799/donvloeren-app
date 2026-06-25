/* =========================================================================
   BEREKENINGEN.JS — Alle rekenlogica voor subtotaal, btw en totaal
   ========================================================================= */

const config = require("./config");

/**
 * Berekent subtotaal, btw-bedrag en totaalbedrag.
 * @param {Array} regels - lijst van { omschrijving, aantal, eenheid, prijsPerEenheid }
 * @returns {Object} { regels (met totaal per regel), subtotaal, btwBedrag, totaalInclBtw }
 */
function berekenTotalen(regels) {
  const regelsMetTotaal = regels.map((regel) => {
    const aantal = Number(regel.aantal) || 0;
    const prijs = Number(regel.prijsPerEenheid) || 0;
    const totaalRegel = Math.round(aantal * prijs * 100) / 100;
    return { ...regel, aantal, prijsPerEenheid: prijs, totaalRegel };
  });

  const subtotaal = regelsMetTotaal.reduce((som, r) => som + r.totaalRegel, 0);
  const subtotaalAfgerond = Math.round(subtotaal * 100) / 100;

  const btwBedrag = Math.round(subtotaalAfgerond * (config.btwPercentage / 100) * 100) / 100;
  const totaalInclBtw = Math.round((subtotaalAfgerond + btwBedrag) * 100) / 100;

  return {
    regels: regelsMetTotaal,
    subtotaal: subtotaalAfgerond,
    btwPercentage: config.btwPercentage,
    btwBedrag,
    totaalInclBtw,
  };
}

/** Formatteert een getal als euro-bedrag: 1234.5 -> "€ 1.234,50" */
function formatEuro(bedrag) {
  const getal = Number(bedrag) || 0;
  return (
    "€ " +
    getal
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".")
  );
}

module.exports = { berekenTotalen, formatEuro };
