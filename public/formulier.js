/* =========================================================================
   FORMULIER.JS — Logica voor het offerte-formulier
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  // ---- 1. Configuratie ophalen ----
  let appConfig = { soortenWerk: [], standaardPrijsPerM2: 15, eenheden: ["m²", "m¹", "stuk", "vrije invoer"] };
  try {
    const response = await fetch("/api/config");
    appConfig = await response.json();
  } catch (fout) {
    console.error("Kon configuratie niet laden:", fout);
  }

  const werkzaamhedenOpNaam = new Map();
  appConfig.soortenWerk.forEach((soort) => {
    werkzaamhedenOpNaam.set(soort.naam.toLowerCase(), soort);
  });

  const datalist = document.getElementById("werkzaamheden-suggesties");
  appConfig.soortenWerk.forEach((soort) => {
    const optie = document.createElement("option");
    optie.value = soort.naam;
    datalist.appendChild(optie);
  });

  // =========================================================================
  // OFFERTENUMMER-LOGICA
  // =========================================================================
  const nummerInput = document.getElementById("offertenummer");
  const knopAutoNummer = document.getElementById("knop-auto-nummer");
  const nummerHint = document.getElementById("nummer-hint");
  const knopGenereren = document.getElementById("knop-genereren");
  const foutBanner = document.getElementById("fout-banner");
  const foutNummer = document.getElementById("fout-nummer");

  // Controleer URL-parameter voor foutmelding bij dubbel nummer
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("fout") === "duplicate") {
    const dubbeleNummer = urlParams.get("nummer") || "";
    foutBanner.style.display = "block";
    foutNummer.textContent = dubbeleNummer;
    // Vul het nummer terug in het veld zodat de gebruiker het kan aanpassen
    nummerInput.value = dubbeleNummer;
    nummerInput.focus();
    // Verwijder de URL-parameter zonder herladen (zodat F5 niet opnieuw fout geeft)
    window.history.replaceState({}, "", "/");
  }

  // Haal het automatische nummer op en toon dit als placeholder
  let automatischNummer = "";
  try {
    const resp = await fetch("/api/volgend-offertenummer");
    const data = await resp.json();
    automatischNummer = data.nummer;
    nummerInput.placeholder = automatischNummer;
  } catch (fout) {
    console.error("Kon volgend nummer niet ophalen:", fout);
  }

  // Knop "Automatisch nummer" — vult het automatische nummer terug in
  knopAutoNummer.addEventListener("click", () => {
    nummerInput.value = automatischNummer;
    nummerHint.textContent = "";
    nummerHint.className = "veld-hint";
    nummerInput.classList.remove("invoer-fout");
  });

  // Live duplicate-check terwijl de gebruiker typt (met debounce)
  let checkTimeout = null;
  nummerInput.addEventListener("input", () => {
    const waarde = nummerInput.value.trim();
    clearTimeout(checkTimeout);
    nummerInput.classList.remove("invoer-fout", "invoer-ok");
    nummerHint.textContent = "";
    nummerHint.className = "veld-hint";

    if (!waarde) return; // leeg = automatisch, geen check nodig

    if (waarde === automatischNummer) {
      nummerHint.textContent = "✓ Dit is het automatisch gegenereerde nummer.";
      nummerHint.className = "veld-hint hint-ok";
      nummerInput.classList.add("invoer-ok");
      return;
    }

    // Wacht 400ms na het typen voordat we de server bevragen (debounce)
    checkTimeout = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/check-offertenummer/${encodeURIComponent(waarde)}`);
        const data = await resp.json();
        if (data.bestaatAl) {
          nummerHint.textContent = "⚠️ Dit nummer bestaat al — kies een ander nummer.";
          nummerHint.className = "veld-hint hint-fout";
          nummerInput.classList.add("invoer-fout");
          nummerInput.classList.remove("invoer-ok");
        } else {
          nummerHint.textContent = "✓ Dit nummer is beschikbaar.";
          nummerHint.className = "veld-hint hint-ok";
          nummerInput.classList.add("invoer-ok");
          nummerInput.classList.remove("invoer-fout");
        }
      } catch (fout) {
        console.error("Kon nummer niet controleren:", fout);
      }
    }, 400);
  });

  // Voorkom versturen als het nummer al bestaat
  document.getElementById("offerte-formulier").addEventListener("submit", async (event) => {
    const waarde = nummerInput.value.trim();
    if (waarde) {
      // Doe nog een laatste synchrone check voordat we versturen
      try {
        const resp = await fetch(`/api/check-offertenummer/${encodeURIComponent(waarde)}`);
        const data = await resp.json();
        if (data.bestaatAl) {
          event.preventDefault();
          nummerHint.textContent = "⚠️ Dit nummer bestaat al — kies een ander nummer.";
          nummerHint.className = "veld-hint hint-fout";
          nummerInput.classList.add("invoer-fout");
          nummerInput.classList.remove("invoer-ok");
          nummerInput.focus();
          foutBanner.style.display = "block";
          foutNummer.textContent = waarde;
          return;
        }
      } catch (fout) {
        // Bij een netwerkfout laten we de server-side check het afhandelen
        console.error("Check mislukt, doorgaan met server-check:", fout);
      }
    }

    // Werkregels verzamelen als JSON
    const regels = [];
    tabelBody.querySelectorAll(".werk-rij").forEach((rijEl) => {
      const omschrijving = rijEl.querySelector(".werk-omschrijving").value.trim();
      const aantal = Number(rijEl.querySelector(".werk-aantal").value) || 0;
      const prijsPerEenheid = Number(rijEl.querySelector(".werk-prijs").value) || 0;
      const eenheid = leesEenheid(rijEl);
      if (!omschrijving && !aantal && !prijsPerEenheid) return;
      regels.push({ omschrijving, aantal, eenheid, prijsPerEenheid });
    });
    document.getElementById("werkRegelsJson").value = JSON.stringify(regels);
  });

  // =========================================================================
  // WERKZAAMHEDEN-TABEL
  // =========================================================================
  const tabelBody = document.getElementById("werk-rijen-body");
  const rijTemplate = document.getElementById("werk-rij-template");
  const knopWerkToevoegen = document.getElementById("knop-werk-toevoegen");

  const liveSubtotaalEl = document.getElementById("live-subtotaal");
  const liveBtwEl = document.getElementById("live-btw");
  const liveTotaalEl = document.getElementById("live-totaal-bedrag");
  const BTW_PERCENTAGE = 21;

  function formatEuroBrowser(bedrag) {
    const getal = Number(bedrag) || 0;
    return "€ " + getal.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".");
  }

  function voegWerkRijToe(focusOpOmschrijving) {
    const kloon = rijTemplate.content.cloneNode(true);
    const rijEl = kloon.querySelector(".werk-rij");
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
    if (focusOpOmschrijving) nieuweRij.querySelector(".werk-omschrijving").focus();
    return nieuweRij;
  }

  function koppelRijEvents(rijEl) {
    const omschrijvingInput = rijEl.querySelector(".werk-omschrijving");
    const aantalInput = rijEl.querySelector(".werk-aantal");
    const eenheidSelect = rijEl.querySelector(".werk-eenheid");
    const eenheidVrijInput = rijEl.querySelector(".werk-eenheid-vrij");
    const prijsInput = rijEl.querySelector(".werk-prijs");
    const verwijderKnop = rijEl.querySelector(".knop-rij-verwijderen");

    omschrijvingInput.addEventListener("change", () => {
      const gekozenNaam = omschrijvingInput.value.trim().toLowerCase();
      const bekende = werkzaamhedenOpNaam.get(gekozenNaam);
      if (bekende) {
        if (!prijsInput.value || Number(prijsInput.value) === 0) prijsInput.value = bekende.prijs;
        zetEenheid(rijEl, bekende.eenheid);
        werkTotalenBij();
      }
    });

    eenheidSelect.addEventListener("change", () => {
      if (eenheidSelect.value === "vrije invoer") {
        eenheidSelect.style.display = "none";
        eenheidVrijInput.style.display = "block";
        eenheidVrijInput.value = "";
        eenheidVrijInput.focus();
      }
    });

    eenheidVrijInput.addEventListener("blur", () => {
      if (!eenheidVrijInput.value.trim()) {
        eenheidVrijInput.style.display = "none";
        eenheidSelect.style.display = "block";
        eenheidSelect.value = appConfig.eenheden[0];
      }
    });

    [aantalInput, prijsInput].forEach((input) => input.addEventListener("input", werkTotalenBij));
    eenheidVrijInput.addEventListener("input", werkTotalenBij);

    verwijderKnop.addEventListener("click", () => { rijEl.remove(); werkTotalenBij(); });

    [omschrijvingInput, aantalInput, prijsInput].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const alleRijen = Array.from(tabelBody.querySelectorAll(".werk-rij"));
        const idx = alleRijen.indexOf(rijEl);
        if (idx === alleRijen.length - 1) {
          voegWerkRijToe(true);
        } else {
          const volgend = alleRijen[idx + 1];
          const kolomKlasse = input.classList[0];
          const doel = volgend.querySelector(`.${kolomKlasse}`);
          if (doel) doel.focus();
        }
      });
    });
  }

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

  function leesEenheid(rijEl) {
    const eenheidSelect = rijEl.querySelector(".werk-eenheid");
    const eenheidVrijInput = rijEl.querySelector(".werk-eenheid-vrij");
    if (eenheidSelect.value === "vrije invoer") return eenheidVrijInput.value.trim() || "stuk";
    return eenheidSelect.value;
  }

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
    liveSubtotaalEl.textContent = formatEuroBrowser(subtotaal);
    liveBtwEl.textContent = formatEuroBrowser(btw);
    liveTotaalEl.textContent = formatEuroBrowser(subtotaal + btw);
  }

  knopWerkToevoegen.addEventListener("click", () => voegWerkRijToe(true));
  voegWerkRijToe(false);
});
