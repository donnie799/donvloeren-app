/* =========================================================================
   FORMULIER.JS — Logica voor het offerte-formulier (index.html)
   =========================================================================
   Dit bestand regelt de volledige werkzaamheden-calculatietabel:
   - Elke rij is een zelfstandige werkzaamheid (geen "hoofdwerk" meer)
   - Werkzaamheid kiezen via voorstellen (datalist) ÓF vrije tekst typen
   - Bij het kiezen van een bekende werkzaamheid wordt de standaardprijs en
     eenheid automatisch ingevuld (de gebruiker kan dit per offerte nog
     aanpassen, zonder dat de standaardprijs in config.js verandert)
   - Eenheid kiezen via dropdown, met een "Vrije invoer"-optie voor eigen tekst
   - Rijen toevoegen/verwijderen
   - Live subtotaal/btw/totaal berekening, en per-regel totaal
   - Tab/Enter navigeren: Enter in de laatste rij voegt een nieuwe rij toe
   - Vlak voor het versturen van het formulier worden alle rijen verzameld
     in het verborgen veld #werkRegelsJson, als JSON-array
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  // ---- 1. Configuratie ophalen (werkzaamheden-prijslijst + eenheden) ----
  let appConfig = { soortenWerk: [], standaardPrijsPerM2: 15, eenheden: ["m²", "m¹", "stuk", "vrije invoer"] };
  try {
    const response = await fetch("/api/config");
    appConfig = await response.json();
  } catch (fout) {
    console.error("Kon configuratie niet laden:", fout);
  }

  // Snelle opzoektabel: werkzaamheid-naam (lowercase) -> { prijs, eenheid }
  const werkzaamhedenOpNaam = new Map();
  appConfig.soortenWerk.forEach((soort) => {
    werkzaamhedenOpNaam.set(soort.naam.toLowerCase(), soort);
  });

  // Datalist vullen met alle bekende werkzaamheden, zodat de gebruiker
  // suggesties krijgt terwijl hij typt (maar nog steeds vrije tekst kan typen)
  const datalist = document.getElementById("werkzaamheden-suggesties");
  appConfig.soortenWerk.forEach((soort) => {
    const optie = document.createElement("option");
    optie.value = soort.naam;
    datalist.appendChild(optie);
  });

  // ---- 2. Tabel-elementen ----
  const tabelBody = document.getElementById("werk-rijen-body");
  const rijTemplate = document.getElementById("werk-rij-template");
  const knopWerkToevoegen = document.getElementById("knop-werk-toevoegen");
  const werkRegelsJsonInput = document.getElementById("werkRegelsJson");

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

  // -----------------------------------------------------------------------
  // Eén rij toevoegen aan de tabel
  // -----------------------------------------------------------------------
  function voegWerkRijToe(focusOpOmschrijving) {
    const kloon = rijTemplate.content.cloneNode(true);
    const rijEl = kloon.querySelector(".werk-rij");

    // Eenheid-dropdown van deze rij vullen met de opties uit config.js
    const eenheidSelect = rijEl.querySelector(".werk-eenheid");
    appConfig.eenheden.forEach((eenheid) => {
      const optie = document.createElement("option");
      optie.value = eenheid;
      optie.textContent = eenheid === "vrije invoer" ? "Vrije invoer…" : eenheid;
      eenheidSelect.appendChild(optie);
    });

    tabelBody.appendChild(rijEl);

    const nieuweRij = tabelBody.lastElementChild;
    koppelRijEvents(nieuweRij);
    werkTotalenBij();

    if (focusOpOmschrijving) {
      const omschrijvingInput = nieuweRij.querySelector(".werk-omschrijving");
      omschrijvingInput.focus();
    }

    return nieuweRij;
  }

  // -----------------------------------------------------------------------
  // Events koppelen aan alle invoervelden van één rij
  // -----------------------------------------------------------------------
  function koppelRijEvents(rijEl) {
    const omschrijvingInput = rijEl.querySelector(".werk-omschrijving");
    const aantalInput = rijEl.querySelector(".werk-aantal");
    const eenheidSelect = rijEl.querySelector(".werk-eenheid");
    const eenheidVrijInput = rijEl.querySelector(".werk-eenheid-vrij");
    const prijsInput = rijEl.querySelector(".werk-prijs");
    const verwijderKnop = rijEl.querySelector(".knop-rij-verwijderen");

    // Zodra de gebruiker een bekende werkzaamheid kiest/typt, vul automatisch
    // de standaardprijs en eenheid in (handmatig aanpasbaar, verandert nooit
    // de standaardprijs in config.js zelf).
    omschrijvingInput.addEventListener("change", () => {
      const gekozenNaam = omschrijvingInput.value.trim().toLowerCase();
      const bekendeWerkzaamheid = werkzaamhedenOpNaam.get(gekozenNaam);
      if (bekendeWerkzaamheid) {
        // Alleen automatisch invullen als de prijs nog leeg/0 is, zodat we
        // een eventuele handmatige aanpassing van de gebruiker niet overschrijven.
        if (!prijsInput.value || Number(prijsInput.value) === 0) {
          prijsInput.value = bekendeWerkzaamheid.prijs;
        }
        zetEenheid(rijEl, bekendeWerkzaamheid.eenheid);
        werkTotalenBij();
      }
    });

    // Eenheid-dropdown: bij "vrije invoer" tonen we een tekstveld in plaats
    // van de dropdown, zodat de gebruiker zelf een eenheid kan typen (bijv. "set").
    eenheidSelect.addEventListener("change", () => {
      if (eenheidSelect.value === "vrije invoer") {
        eenheidSelect.style.display = "none";
        eenheidVrijInput.style.display = "block";
        eenheidVrijInput.value = "";
        eenheidVrijInput.focus();
      }
    });

    // Als de gebruiker het vrije-invoer-tekstveld leeg verlaat, terug naar de dropdown
    eenheidVrijInput.addEventListener("blur", () => {
      if (!eenheidVrijInput.value.trim()) {
        eenheidVrijInput.style.display = "none";
        eenheidSelect.style.display = "block";
        eenheidSelect.value = appConfig.eenheden[0];
      }
    });

    [aantalInput, prijsInput].forEach((input) => {
      input.addEventListener("input", werkTotalenBij);
    });
    eenheidVrijInput.addEventListener("input", werkTotalenBij);

    // Rij verwijderen
    verwijderKnop.addEventListener("click", () => {
      rijEl.remove();
      werkTotalenBij();
    });

    // ---- Sneltoetsen: Enter springt naar volgende rij (of voegt een nieuwe toe) ----
    [omschrijvingInput, aantalInput, prijsInput].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();

        const alleRijen = Array.from(tabelBody.querySelectorAll(".werk-rij"));
        const huidigeIndex = alleRijen.indexOf(rijEl);
        const isLaatsteRij = huidigeIndex === alleRijen.length - 1;

        if (isLaatsteRij) {
          // In de laatste rij: nieuwe rij toevoegen en daar focussen
          voegWerkRijToe(true);
        } else {
          // Anders: spring naar dezelfde kolom in de volgende rij
          const volgendeRij = alleRijen[huidigeIndex + 1];
          const kolomKlasse = input.classList[0];
          const doelInput = volgendeRij.querySelector(`.${kolomKlasse}`);
          if (doelInput) doelInput.focus();
        }
      });
    });
  }

  // Zet de eenheid van een rij, inclusief het tonen van het vrije-invoerveld
  // als de eenheid niet in de standaardlijst voorkomt.
  function zetEenheid(rijEl, eenheid) {
    const eenheidSelect = rijEl.querySelector(".werk-eenheid");
    const eenheidVrijInput = rijEl.querySelector(".werk-eenheid-vrij");

    const bestaatInLijst = appConfig.eenheden.includes(eenheid) && eenheid !== "vrije invoer";
    if (bestaatInLijst) {
      eenheidSelect.value = eenheid;
      eenheidSelect.style.display = "block";
      eenheidVrijInput.style.display = "none";
    } else {
      eenheidSelect.value = "vrije invoer";
      eenheidSelect.style.display = "none";
      eenheidVrijInput.style.display = "block";
      eenheidVrijInput.value = eenheid;
    }
  }

  // Leest de daadwerkelijke eenheid-waarde van een rij (dropdown of vrij tekstveld)
  function leesEenheid(rijEl) {
    const eenheidSelect = rijEl.querySelector(".werk-eenheid");
    const eenheidVrijInput = rijEl.querySelector(".werk-eenheid-vrij");
    if (eenheidSelect.value === "vrije invoer") {
      return eenheidVrijInput.value.trim() || "stuk";
    }
    return eenheidSelect.value;
  }

  // -----------------------------------------------------------------------
  // Alle rijen uitlezen, per-regel totaal bijwerken, en het grote totaal
  // (subtotaal/btw/totaal) live berekenen en tonen.
  // -----------------------------------------------------------------------
  function werkTotalenBij() {
    let subtotaal = 0;

    tabelBody.querySelectorAll(".werk-rij").forEach((rijEl) => {
      const aantal = Number(rijEl.querySelector(".werk-aantal").value) || 0;
      const prijs = Number(rijEl.querySelector(".werk-prijs").value) || 0;
      const totaalRegel = aantal * prijs;

      rijEl.querySelector(".werk-regel-totaal").textContent = formatEuroBrowser(totaalRegel);
      subtotaal += totaalRegel;
    });

    const btw = subtotaal * (BTW_PERCENTAGE / 100);
    const totaal = subtotaal + btw;

    liveSubtotaalEl.textContent = formatEuroBrowser(subtotaal);
    liveBtwEl.textContent = formatEuroBrowser(btw);
    liveTotaalEl.textContent = formatEuroBrowser(totaal);
  }

  knopWerkToevoegen.addEventListener("click", () => voegWerkRijToe(true));

  // Bij het laden van de pagina: begin met 1 lege rij, klaar om in te vullen
  voegWerkRijToe(false);

  // -----------------------------------------------------------------------
  // Vlak voor het versturen van het formulier: alle rijen verzamelen als
  // JSON en in het verborgen veld zetten, zodat de server ze kan verwerken.
  // -----------------------------------------------------------------------
  const formulier = document.getElementById("offerte-formulier");
  formulier.addEventListener("submit", () => {
    const regels = [];
    tabelBody.querySelectorAll(".werk-rij").forEach((rijEl) => {
      const omschrijving = rijEl.querySelector(".werk-omschrijving").value.trim();
      const aantal = Number(rijEl.querySelector(".werk-aantal").value) || 0;
      const prijsPerEenheid = Number(rijEl.querySelector(".werk-prijs").value) || 0;
      const eenheid = leesEenheid(rijEl);

      // Sla volledig lege rijen over
      if (!omschrijving && !aantal && !prijsPerEenheid) return;

      regels.push({ omschrijving, aantal, eenheid, prijsPerEenheid });
    });

    werkRegelsJsonInput.value = JSON.stringify(regels);
  });
});
