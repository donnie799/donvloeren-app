/* =========================================================================
   FORMULIER.JS — Logica voor het offerte-formulier (index.html)
   =========================================================================
   - Vult de dropdown "Soort werk" met opties uit config.js (via /api/config)
   - Vult bij het kiezen van een soort werk automatisch de juiste prijs en
     eenheid in (bijv. "Plinten plaatsen" → € 6,00 per m¹)
   - Maakt het mogelijk om extra werkzaamheden-regels toe te voegen/verwijderen
   - Berekent live (in de browser) het subtotaal, btw en totaal, zodat de
     gebruiker meteen ziet wat de offerte ongeveer wordt — de uiteindelijke,
     officiële berekening gebeurt op de server in berekeningen.js
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  // ---- 1. Configuratie ophalen (soorten werk + prijzen + eenheden) ----
  // appConfig.soortenWerk is een lijst van objecten: { naam, prijs, eenheid }
  let appConfig = { soortenWerk: [], standaardPrijsPerM2: 0 };
  try {
    const response = await fetch("/api/config");
    appConfig = await response.json();
  } catch (fout) {
    console.error("Kon configuratie niet laden:", fout);
  }

  const soortWerkSelect = document.getElementById("soortWerk");
  const prijsPerM2Input = document.getElementById("prijsPerM2");
  const eenheidHoofdwerkInput = document.getElementById("eenheidHoofdwerk");
  const labelAantal = document.getElementById("label-aantal");
  const labelPrijs = document.getElementById("label-prijs");

  // Dropdown vullen met elk soort werk uit config.js
  appConfig.soortenWerk.forEach((soort) => {
    const optie = document.createElement("option");
    optie.value = soort.naam;
    optie.textContent = `${soort.naam} (€ ${soort.prijs.toFixed(2).replace(".", ",")} per ${soort.eenheid})`;
    // De prijs en eenheid bewaren we op de <option> zelf, zodat we ze
    // straks makkelijk kunnen terugvinden bij het kiezen van deze optie.
    optie.dataset.prijs = soort.prijs;
    optie.dataset.eenheid = soort.eenheid;
    soortWerkSelect.appendChild(optie);
  });

  // Past het label en de eenheid aan op basis van het gekozen soort werk,
  // bijv. "Aantal m²" wordt "Aantal m¹" bij Plinten plaatsen, of
  // "Aantal stuks" bij Trap PVC.
  function labelVoorEenheid(eenheid) {
    if (eenheid === "stuk") return "Aantal stuks";
    return `Aantal ${eenheid}`;
  }

  function vulPrijsEnEenheidIn() {
    const gekozenOptie = soortWerkSelect.options[soortWerkSelect.selectedIndex];
    if (!gekozenOptie || !gekozenOptie.dataset.prijs) return;

    const prijs = Number(gekozenOptie.dataset.prijs);
    const eenheid = gekozenOptie.dataset.eenheid;

    prijsPerM2Input.value = prijs;
    eenheidHoofdwerkInput.value = eenheid;
    labelAantal.textContent = labelVoorEenheid(eenheid);
    labelPrijs.textContent = `Prijs per ${eenheid} (excl. btw)`;

    berekenLiveTotaal();
  }

  soortWerkSelect.addEventListener("change", vulPrijsEnEenheidIn);

  // Bij het laden van de pagina meteen de eerste optie invullen
  if (appConfig.soortenWerk.length > 0) {
    vulPrijsEnEenheidIn();
  } else {
    prijsPerM2Input.value = appConfig.standaardPrijsPerM2;
  }

  // ---- 2. Extra werkzaamheden: rijen toevoegen/verwijderen ----
  const extraLijst = document.getElementById("extra-werk-lijst");
  const template = document.getElementById("extra-werk-rij-template");
  const knopToevoegen = document.getElementById("knop-extra-toevoegen");

  function voegExtraRijToe() {
    const kloon = template.content.cloneNode(true);
    extraLijst.appendChild(kloon);
    koppelLiveBerekeningAanNieuweRij();
    berekenLiveTotaal();
  }

  knopToevoegen.addEventListener("click", voegExtraRijToe);

  extraLijst.addEventListener("click", (event) => {
    if (event.target.classList.contains("knop-rij-verwijderen")) {
      event.target.closest(".extra-werk-rij").remove();
      berekenLiveTotaal();
    }
  });

  function koppelLiveBerekeningAanNieuweRij() {
    const rijen = extraLijst.querySelectorAll(".extra-werk-rij");
    const laatsteRij = rijen[rijen.length - 1];
    laatsteRij.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", berekenLiveTotaal);
    });
  }

  // ---- 3. Live totaal berekenen ----
  const aantalM2Input = document.getElementById("aantalM2");
  const liveSubtotaalEl = document.getElementById("live-subtotaal");
  const liveBtwEl = document.getElementById("live-btw");
  const liveTotaalEl = document.getElementById("live-totaal-bedrag");

  const BTW_PERCENTAGE = 21; // Let op: moet gelijk zijn aan config.js -> btwPercentage

  function formatEuroBrowser(bedrag) {
    const getal = Number(bedrag) || 0;
    return (
      "€ " +
      getal
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".")
    );
  }

  function berekenLiveTotaal() {
    let subtotaal = 0;

    const aantalM2 = Number(aantalM2Input.value) || 0;
    const prijsPerM2 = Number(prijsPerM2Input.value) || 0;
    subtotaal += aantalM2 * prijsPerM2;

    extraLijst.querySelectorAll(".extra-werk-rij").forEach((rij) => {
      const aantal = Number(rij.querySelector('[name="extraAantal"]').value) || 0;
      const prijs = Number(rij.querySelector('[name="extraPrijs"]').value) || 0;
      subtotaal += aantal * prijs;
    });

    const btw = subtotaal * (BTW_PERCENTAGE / 100);
    const totaal = subtotaal + btw;

    liveSubtotaalEl.textContent = formatEuroBrowser(subtotaal);
    liveBtwEl.textContent = formatEuroBrowser(btw);
    liveTotaalEl.textContent = formatEuroBrowser(totaal);
  }

  aantalM2Input.addEventListener("input", berekenLiveTotaal);
  prijsPerM2Input.addEventListener("input", berekenLiveTotaal);

  berekenLiveTotaal();
});
