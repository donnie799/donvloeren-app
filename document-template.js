const config = require("./config");
const { formatEuro } = require("./berekeningen");

function escapeHtml(tekst) {
  if (tekst === undefined || tekst === null) return "";
  return String(tekst).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDatum(isoDatum) {
  const d = new Date(isoDatum);
  return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
}

function renderDocumentHtml(record, modus) {
  const isFactuur = modus === "factuur";
  const { regels, subtotaal, btwBedrag, totaalInclBtw, btwVerlegd } = record.berekening;

  const titel = isFactuur ? "FACTUUR" : "OFFERTE";
  const nummerLabel = isFactuur ? "Factuurnummer" : "Offertenummer";
  const nummer = isFactuur ? record.factuurnummer : record.offertenummer;
  const datumLabel = isFactuur ? "Factuurdatum" : "Offertedatum";
  const datum = isFactuur ? record.factuurdatum : record.aangemaaktOp;
  const derdeLabel = isFactuur ? "Vervaldatum" : "Geldig tot";
  const derdeDatum = isFactuur ? record.vervaldatum : record.geldigTot;
  const voorwaarden = isFactuur ? config.factuurVoorwaarden : config.offerteVoorwaarden;
  const introTekst = isFactuur ? "Wij brengen u onderstaande werkzaamheden in rekening:" : "Hierbij bieden wij u, geheel vrijblijvend, de volgende werkzaamheden aan:";
  const klant = record.klant;

  const regelsHtml = regels.map((r) => `
    <tr>
      <td>${escapeHtml(r.omschrijving)}</td>
      <td class="center">${escapeHtml(r.aantal)}</td>
      <td class="center">${escapeHtml(r.eenheid)}</td>
      <td class="right">${formatEuro(r.prijsPerEenheid)}</td>
      <td class="right">${formatEuro(r.totaalRegel)}</td>
    </tr>`).join("");

  let extraLegeRijen = "";
  for (let i = regels.length; i < 5; i++) {
    extraLegeRijen += `<tr class="lege-rij"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>`;
  }

  // BTW-regel: normaal of verlegd
  const btwRegelHtml = btwVerlegd
    ? `<p class="totaal-regel"><span>Btw (verlegd)</span><strong>€ 0,00</strong></p>`
    : `<p class="totaal-regel"><span>Btw (21%)</span><strong>${formatEuro(btwBedrag)}</strong></p>`;

  // BTW-verlegd melding onderaan de offerte
  const btwVerlengdMeldingHtml = btwVerlegd
    ? `<p class="btw-verlegd-melding">BTW verlegd naar afnemer — art. 12 Wet op de Omzetbelasting 1968</p>`
    : "";

  const voorwaardenHtml = voorwaarden.map((v) => `<li>${escapeHtml(v)}</li>`).join("");
  const opmerkingenHtml = record.klus.opmerkingen
    ? `<div class="opmerkingen-klant"><strong>Opmerkingen:</strong><p>${escapeHtml(record.klus.opmerkingen)}</p></div>`
    : "";

  const rechtsOnderBlok = isFactuur
    ? `<h3 class="sectie-titel">Betaalgegevens</h3>
       <p class="betaal-regel"><span>Begunstigde</span><strong>${escapeHtml(config.bedrijf.naam)}</strong></p>
       <p class="betaal-regel"><span>IBAN</span><strong>${escapeHtml(config.bedrijf.iban)}</strong></p>
       <p class="betaal-regel"><span>Kenmerk</span><strong>${escapeHtml(record.factuurnummer)}</strong></p>`
    : `<h3 class="sectie-titel">Akkoord geven</h3>
       <p class="akkoord-tekst">Gaat u akkoord met deze offerte? Klik dan op de knop hieronder. Er wordt dan automatisch een factuur aangemaakt.</p>
       <form method="POST" action="/offerte/${record.id}/akkoord" class="akkoord-form no-print">
         <button type="submit" class="btn btn-gold">✓ Akkoord geven &amp; factuur maken</button>
       </form>`;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8"/>
<title>${titel} ${escapeHtml(nummer)} — ${escapeHtml(config.bedrijf.naam)}</title>
<link rel="stylesheet" href="/css/stijl.css"/>
<link rel="stylesheet" href="/css/document.css"/>
<link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32.png"/>
<meta name="theme-color" content="#14120f"/>
</head>
<body class="document-pagina">
  <div class="actie-balk no-print">
    <a href="/" class="btn btn-outline">&larr; Terug naar formulier</a>
    <button onclick="window.print()" class="btn btn-zwart">⬇ Download ${isFactuur ? "factuur" : "offerte"} als PDF</button>
  </div>
  <div class="document-vel">
    <div class="document-header">
      <img src="${config.bedrijf.logoPad}" alt="${escapeHtml(config.bedrijf.naam)} logo" class="logo"/>
      <div class="header-rechts">
        <h1 class="document-titel">${titel}</h1>
        <p class="meta-regel"><span>${nummerLabel}</span><strong>${escapeHtml(nummer)}</strong></p>
        <p class="meta-regel"><span>${datumLabel}</span><strong>${formatDatum(datum)}</strong></p>
        <p class="meta-regel"><span>${derdeLabel}</span><strong>${formatDatum(derdeDatum)}</strong></p>
        ${btwVerlegd ? `<p class="meta-regel btw-verlegd-badge"><span>BTW</span><strong>Verlegd</strong></p>` : ""}
      </div>
    </div>
    <div class="adres-blok">
      <div class="klant-adres">
        <h3 class="sectie-titel">${isFactuur ? "Factuuradres" : "Aan"}</h3>
        <p><strong>${escapeHtml(klant.naam)}</strong></p>
        <p>${escapeHtml(klant.adres)}</p>
        <p>${escapeHtml(klant.postcode)} ${escapeHtml(klant.plaats)}</p>
        <p>${escapeHtml(klant.telefoon)}</p>
        <p>${escapeHtml(klant.email)}</p>
        ${klant.btwNummer ? `<p>BTW: ${escapeHtml(klant.btwNummer)}</p>` : ""}
      </div>
      <div class="van-kaart">
        <h3 class="sectie-titel-goud">Van</h3>
        <p><strong>${escapeHtml(config.bedrijf.naam)}</strong></p>
        <p>${escapeHtml(config.bedrijf.straat)}</p>
        <p>${escapeHtml(config.bedrijf.postcodePlaats)}</p>
        <p>${escapeHtml(config.bedrijf.telefoon)}</p>
        <p>${escapeHtml(config.bedrijf.email)}</p>
        <p>${escapeHtml(config.bedrijf.website)}</p>
      </div>
    </div>
    <p class="intro-tekst">${introTekst}</p>
    <table class="werk-tabel">
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th class="center">Aantal</th>
          <th class="center">Eenheid</th>
          <th class="right">Prijs excl.</th>
          <th class="right">Totaal excl.</th>
        </tr>
      </thead>
      <tbody>${regelsHtml}${extraLegeRijen}</tbody>
    </table>
    ${opmerkingenHtml}
    <div class="totalen-blok">
      <div class="totalen-tabel">
        <p class="totaal-regel"><span>Subtotaal excl. btw</span><strong>${formatEuro(subtotaal)}</strong></p>
        ${btwRegelHtml}
        <p class="totaal-regel totaal-eind"><span>Totaal incl. btw</span><strong>${formatEuro(totaalInclBtw)}</strong></p>
      </div>
    </div>
    ${btwVerlengdMeldingHtml}
    <div class="onderkant-blok">
      <div class="voorwaarden-blok">
        <h3 class="sectie-titel">${isFactuur ? "Betalingsvoorwaarden" : "Opmerkingen / voorwaarden"}</h3>
        <ul class="voorwaarden-lijst">${voorwaardenHtml}</ul>
      </div>
      <div class="rechts-onder-blok">${rechtsOnderBlok}</div>
    </div>
    <p class="bedank-tekst">Bedankt voor uw vertrouwen in ${escapeHtml(config.bedrijf.naam)}.</p>
    <div class="document-footer">
      <strong>${escapeHtml(config.bedrijf.naam)}</strong> ·
      ${escapeHtml(config.bedrijf.straat)}, ${escapeHtml(config.bedrijf.postcodePlaats)} ·
      ${escapeHtml(config.bedrijf.telefoon)} ·
      ${escapeHtml(config.bedrijf.email)} ·
      ${escapeHtml(config.bedrijf.website)}<br/>
      KvK ${escapeHtml(config.bedrijf.kvk)} · BTW ${escapeHtml(config.bedrijf.btwNummer)} · IBAN ${escapeHtml(config.bedrijf.iban)}
    </div>
  </div>
</body>
</html>`;
}

module.exports = { renderDocumentHtml };
