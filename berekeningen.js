const config = require("./config");
function berekenTotalen(regels, btwVerlegd) {
  const regelsMetTotaal = regels.map((regel) => {
    const aantal = Number(regel.aantal) || 0;
    const prijs = Number(regel.prijsPerEenheid) || 0;
    return { ...regel, aantal, prijsPerEenheid: prijs, totaalRegel: Math.round(aantal * prijs * 100) / 100 };
  });
  const subtotaal = Math.round(regelsMetTotaal.reduce((som, r) => som + r.totaalRegel, 0) * 100) / 100;
  const btwPercentage = btwVerlegd ? 0 : config.btwPercentage;
  const btwBedrag = Math.round(subtotaal * (btwPercentage / 100) * 100) / 100;
  const totaalInclBtw = Math.round((subtotaal + btwBedrag) * 100) / 100;
  return { regels: regelsMetTotaal, subtotaal, btwPercentage, btwBedrag, totaalInclBtw, btwVerlegd: !!btwVerlegd };
}
function formatEuro(bedrag) {
  const getal = Number(bedrag) || 0;
  return "€ " + getal.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".");
}
module.exports = { berekenTotalen, formatEuro };
