document.addEventListener("DOMContentLoaded", async () => {
  // ---- Config ophalen ----
  let appConfig = { soortenWerk: [], standaardPrijsPerM2: 15, eenheden: ["m²", "m¹", "stuk", "vrije invoer"] };
  try { const r = await fetch("/api/config"); appConfig = await r.json(); } catch (e) { console.error("Config laden mislukt:", e); }

  const werkzaamhedenOpNaam = new Map();
  appConfig.soortenWerk.forEach((s) => werkzaamhedenOpNaam.set(s.naam.toLowerCase(), s));

  const datalist = document.getElementById("werkzaamheden-suggesties");
  appConfig.soortenWerk.forEach((s) => { const o = document.createElement("option"); o.value = s.naam; datalist.appendChild(o); });

  // ---- Offertenummer ----
  const nummerInput = document.getElementById("offertenummer");
  const knopAutoNummer = document.getElementById("knop-auto-nummer");
  const nummerHint = document.getElementById("nummer-hint");
  const foutBanner = document.getElementById("fout-banner");
  const foutNummer = document.getElementById("fout-nummer");

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("fout") === "duplicate") {
    const dn = urlParams.get("nummer") || "";
    foutBanner.style.display = "block";
    foutNummer.textContent = dn;
    nummerInput.value = dn;
    nummerInput.focus();
    window.history.replaceState({}, "", "/");
  }

  let automatischNummer = "";
  try { const r = await fetch("/api/volgend-offertenummer"); const d = await r.json(); automatischNummer = d.nummer; nummerInput.placeholder = automatischNummer; } catch (e) {}

  knopAutoNummer.addEventListener("click", () => {
    nummerInput.value = automatischNummer;
    nummerHint.textContent = "";
    nummerHint.className = "veld-hint";
    nummerInput.classList.remove("invoer-fout", "invoer-ok");
  });

  let checkTimeout = null;
  nummerInput.addEventListener("input", () => {
    const waarde = nummerInput.value.trim();
    clearTimeout(checkTimeout);
    nummerInput.classList.remove("invoer-fout", "invoer-ok");
    nummerHint.textContent = "";
    nummerHint.className = "veld-hint";
    if (!waarde) return;
    if (waarde === automatischNummer) {
      nummerHint.textContent = "✓ Dit is het automatisch gegenereerde nummer.";
      nummerHint.className = "veld-hint hint-ok";
      nummerInput.classList.add("invoer-ok");
      return;
    }
    checkTimeout = setTimeout(async () => {
      try {
        const r = await fetch(`/api/check-offertenummer/${encodeURIComponent(waarde)}`);
        const d = await r.json();
        if (d.bestaatAl) {
          nummerHint.textContent = "⚠️ Dit nummer bestaat al — kies een ander nummer.";
          nummerHint.className = "veld-hint hint-fout";
          nummerInput.classList.add("invoer-fout");
        } else {
          nummerHint.textContent = "✓ Dit nummer is beschikbaar.";
          nummerHint.className = "veld-hint hint-ok";
          nummerInput.classList.add("invoer-ok");
        }
      } catch (e) {}
    }, 400);
  });

  // ---- BTW verlegd ----
  const btwVerlegd = document.getElementById("btwVerlegd");
  const liveBtwLabel = document.getElementById("live-btw-label");
  const liveBtwEl = document.getElementById("live-btw");
  const klantBtwVeld = document.getElementById("klant-btw-veld");

  btwVerlegd.addEventListener("change", () => {
    liveBtwLabel.textContent = btwVerlegd.checked ? "Btw (verlegd)" : "Btw (21%)";
    klantBtwVeld.style.display = btwVerlegd.checked ? "block" : "none";
    werkTotalenBij();
  });

  // ---- Tabel ----
  const tabelBody = document.getElementById("werk-rijen-body");
  const rijTemplate = document.getElementById("werk-rij-template");
  const knopWerkToevoegen = document.getElementById("knop-werk-toevoegen");
  const liveSubtotaalEl = document.getElementById("live-subtotaal");
  const liveTotaalEl = document.getElementById("live-totaal-bedrag");
  const BTW = 21;

  function fmt(bedrag) {
    const g = Number(bedrag) || 0;
    return "€ " + g.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".");
  }

  function voegWerkRijToe(focus) {
    const kloon = rijTemplate.content.cloneNode(true);
    const rijEl = kloon.querySelector(".werk-rij");
    const sel = rijEl.querySelector(".werk-eenheid");
    appConfig.eenheden.forEach((e) => { const o = document.createElement("option"); o.value = e; o.textContent = e === "vrije invoer" ? "Vrije invoer…" : e; sel.appendChild(o); });
    tabelBody.appendChild(rijEl);
    const nieuw = tabelBody.lastElementChild;
    koppelRijEvents(nieuw);
    werkTotalenBij();
    if (focus) nieuw.querySelector(".werk-omschrijving").focus();
    return nieuw;
  }

  function koppelRijEvents(rijEl) {
    const omschr = rijEl.querySelector(".werk-omschrijving");
    const aantal = rijEl.querySelector(".werk-aantal");
    const sel = rijEl.querySelector(".werk-eenheid");
    const vrij = rijEl.querySelector(".werk-eenheid-vrij");
    const prijs = rijEl.querySelector(".werk-prijs");
    const del = rijEl.querySelector(".knop-rij-verwijderen");

    omschr.addEventListener("change", () => {
      const bekende = werkzaamhedenOpNaam.get(omschr.value.trim().toLowerCase());
      if (bekende) {
        if (!prijs.value || Number(prijs.value) === 0) prijs.value = bekende.prijs;
        zetEenheid(rijEl, bekende.eenheid);
        werkTotalenBij();
      }
    });

    sel.addEventListener("change", () => {
      if (sel.value === "vrije invoer") { sel.style.display = "none"; vrij.style.display = "block"; vrij.value = ""; vrij.focus(); }
    });
    vrij.addEventListener("blur", () => {
      if (!vrij.value.trim()) { vrij.style.display = "none"; sel.style.display = "block"; sel.value = appConfig.eenheden[0]; }
    });

    [aantal, prijs].forEach((i) => i.addEventListener("input", werkTotalenBij));
    vrij.addEventListener("input", werkTotalenBij);
    del.addEventListener("click", () => { rijEl.remove(); werkTotalenBij(); });

    [omschr, aantal, prijs].forEach((input) => {
      input.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        const alleRijen = Array.from(tabelBody.querySelectorAll(".werk-rij"));
        const idx = alleRijen.indexOf(rijEl);
        if (idx === alleRijen.length - 1) { voegWerkRijToe(true); }
        else { const v = alleRijen[idx + 1].querySelector(`.${input.classList[0]}`); if (v) v.focus(); }
      });
    });
  }

  function zetEenheid(rijEl, eenheid) {
    const sel = rijEl.querySelector(".werk-eenheid");
    const vrij = rijEl.querySelector(".werk-eenheid-vrij");
    if (appConfig.eenheden.includes(eenheid) && eenheid !== "vrije invoer") {
      sel.value = eenheid; sel.style.display = "block"; vrij.style.display = "none";
    } else {
      sel.value = "vrije invoer"; sel.style.display = "none"; vrij.style.display = "block"; vrij.value = eenheid;
    }
  }

  function leesEenheid(rijEl) {
    const sel = rijEl.querySelector(".werk-eenheid");
    const vrij = rijEl.querySelector(".werk-eenheid-vrij");
    return sel.value === "vrije invoer" ? (vrij.value.trim() || "stuk") : sel.value;
  }

  function werkTotalenBij() {
    let subtotaal = 0;
    tabelBody.querySelectorAll(".werk-rij").forEach((rijEl) => {
      const a = Number(rijEl.querySelector(".werk-aantal").value) || 0;
      const p = Number(rijEl.querySelector(".werk-prijs").value) || 0;
      const t = a * p;
      rijEl.querySelector(".werk-regel-totaal").textContent = fmt(t);
      subtotaal += t;
    });
    const verlegd = btwVerlegd.checked;
    const btwBedrag = verlegd ? 0 : subtotaal * (BTW / 100);
    liveSubtotaalEl.textContent = fmt(subtotaal);
    liveBtwEl.textContent = verlegd ? "€ 0,00" : fmt(btwBedrag);
    liveTotaalEl.textContent = fmt(subtotaal + btwBedrag);
  }

  knopWerkToevoegen.addEventListener("click", () => voegWerkRijToe(true));
  voegWerkRijToe(false);

  // ---- Submit: regels verzamelen ----
  document.getElementById("offerte-formulier").addEventListener("submit", async (ev) => {
    const waarde = nummerInput.value.trim();
    if (waarde) {
      try {
        const r = await fetch(`/api/check-offertenummer/${encodeURIComponent(waarde)}`);
        const d = await r.json();
        if (d.bestaatAl) {
          ev.preventDefault();
          nummerHint.textContent = "⚠️ Dit nummer bestaat al — kies een ander nummer.";
          nummerHint.className = "veld-hint hint-fout";
          nummerInput.classList.add("invoer-fout");
          nummerInput.focus();
          foutBanner.style.display = "block";
          foutNummer.textContent = waarde;
          return;
        }
      } catch (e) {}
    }
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
});
