# Don Vloeren — Offerte & Factuur app

Een eenvoudige webapp waarmee je:
1. klantgegevens en klusinformatie invult,
2. automatisch een **offerte** laat genereren (met logo, berekeningen, voorwaarden),
3. de offerte kunt downloaden als **PDF**,
4. met één klik op "Akkoord" de offerte automatisch laat omzetten in een **factuur** met een eigen factuurnummer,
5. de factuur ook weer kunt downloaden als PDF.

Gebouwd met simpele technologie: **HTML, CSS, JavaScript en Node.js** (met het Express-framework). Geen ingewikkelde database, geen build-tools.

> **Wil je de app online zetten op een eigen URL (bijv. `https://donvloeren-app.onrender.com`), zodat je niets lokaal hoeft te installeren?**
> Lees dan **`DEPLOY-RENDER.md`** in plaats van dit bestand — die bevat een stap-voor-stap handleiding om de app gratis op Render te zetten, puur via de browser.
>
> Dit bestand (`README.md`) is voor als je de app liever **lokaal op je eigen computer** wil draaien.

---

## 1. Wat heb je nodig?

- Een computer met **Node.js** erop. Download die gratis via [nodejs.org](https://nodejs.org) (neem de "LTS"-versie). Tijdens installatie gewoon overal "Next" klikken.
- Geen verdere kennis nodig — onderstaande stappen zijn letterlijk te volgen.

## 2. App lokaal starten (eerste keer)

1. Pak de map `donvloeren-app` uit op je computer (bijvoorbeeld op je Bureaublad).
2. Open een terminal / opdrachtprompt:
   - **Windows**: open de map in de Verkenner, klik in de adresbalk, typ `cmd` en druk op Enter.
   - **Mac**: open "Terminal" via Spotlight, en typ `cd ` gevolgd door de map (of sleep de map in het terminalvenster na het typen van `cd `).
3. Installeer de benodigde onderdelen (dit moet je maar één keer doen):
   ```
   npm install
   ```
   Dit downloadt het Express-framework. Je ziet een nieuwe map `node_modules` verschijnen — die hoef je nooit te openen of aan te passen.
4. Start de app:
   ```
   npm start
   ```
   Je ziet in de terminal:
   ```
   Open in je browser: http://localhost:3000
   ```
5. Open je browser (Chrome, Edge, Firefox) en ga naar **http://localhost:3000**

Klaar! Je ziet nu het offerte-formulier.

### Volgende keren opstarten

Je hoeft `npm install` niet steeds opnieuw te doen — alleen `npm start` (in de map van de app, via de terminal).

Wil je de app stoppen? Ga naar de terminal en druk op `Ctrl + C`.

---

## 3. Hoe gebruik je de app?

1. Vul op de hoofdpagina de **klantgegevens** in (naam, adres, postcode, plaats, telefoon, e-mail).
2. Vul de **klusinformatie** in: soort werk, aantal m², prijs per m².
3. Eventueel: klik op **"+ Extra werk toevoegen"** om extra regels toe te voegen (bijv. "Plinten plaatsen").
4. Onderaan zie je live het subtotaal, btw en totaalbedrag al uitgerekend.
5. Klik op **"Offerte genereren"**. Je krijgt direct de opgemaakte offerte te zien.
6. Klik op **"Download offerte als PDF"** — dit opent het printvenster van je browser. Kies daar **"Opslaan als PDF"** (of "Microsoft Print to PDF" op Windows) in plaats van een printer, en sla het bestand op.
7. Als de klant akkoord is: klik op **"✓ Akkoord geven & factuur maken"**. De offerte wordt automatisch omgezet in een factuur met een nieuw factuurnummer.
8. Download de factuur op dezelfde manier als PDF.
9. Via **"Overzicht offertes & facturen"** (rechtsboven) zie je alle offertes/facturen die je hebt gemaakt, en kun je ze terugvinden.

---

## 4. Bestandsoverzicht — wat staat waar?

```
donvloeren-app/
├── config.js                 ← Bedrijfsgegevens, prijzen, teksten (BELANGRIJKSTE bestand!)
├── server.js                 ← De webserver, regelt alle pagina's en knoppen
├── berekeningen.js           ← Rekenlogica (subtotaal, btw, totaal)
├── document-template.js      ← Bouwt de opmaak van offerte/factuur
├── storage.js                ← Eenvoudige opslag (leest/schrijft data/offertes.json)
├── package.json              ← Lijst van benodigde onderdelen (voor npm install)
├── data/
│   ├── offertes.json         ← Hier worden al je offertes/facturen opgeslagen
│   └── teller.json           ← Houdt de laatste offerte-/factuurnummers bij
└── public/                    ← Alles wat in de browser te zien is
    ├── index.html             ← Het formulier (de hoofdpagina)
    ├── css/
    │   ├── stijl.css           ← Algemene kleuren, knoppen, formulier-opmaak
    │   └── document.css        ← Opmaak van de offerte/factuur zelf + print/PDF-stijl
    ├── js/
    │   └── formulier.js        ← Logica van het formulier (extra regels, live totaal)
    └── images/
        └── logo.png            ← Jouw logo
```

---

## 5. Hoe pas je dingen aan?

### 5.1 Bedrijfsgegevens, IBAN, KvK, BTW-nummer

Open **`config.js`** en pas het blok `bedrijf: { ... }` aan:

```js
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
  logoPad: "/images/logo.png",
},
```

Sla het bestand op en herstart de server (`Ctrl + C`, dan opnieuw `npm start`). Vernieuw de pagina in je browser.

### 5.2 Logo vervangen

Vervang het bestand **`public/images/logo.png`** door je eigen logo-afbeelding (zelfde bestandsnaam `logo.png`, of pas `logoPad` in `config.js` aan als je een andere naam/bestandstype gebruikt, bijv. `logo.jpg`).

### 5.3 Standaard prijs per m², soorten werk

Ook in **`config.js`**:

```js
standaardPrijsPerM2: 45.0,

soortenWerk: [
  "Egaliseren vloer",
  "Dekvloer storten",
  "Vloerverwarming aanleggen",
  "Renovatie bestaande vloer",
  "Anders / combinatie",
],
```

Voeg of verwijder gewoon regels in de lijst `soortenWerk` — dit vult automatisch de dropdown in het formulier.

### 5.4 BTW-percentage

```js
btwPercentage: 21,
```
**Let op:** als je dit wijzigt, pas dan ook het getal `21` aan in `public/js/formulier.js` (zoek naar `BTW_PERCENTAGE = 21`) zodat het live-totaal in het formulier hetzelfde percentage gebruikt als de uiteindelijke offerte.

### 5.5 Voorwaarden-teksten

In **`config.js`**:
```js
offerteVoorwaarden: [ ... ],
factuurVoorwaarden: [ ... ],
```
Pas de teksten aan, voeg regels toe of verwijder ze.

### 5.6 Offertenummer / factuurnummer opmaak

```js
offertenummerVoorvoegsel: "OFF-",
factuurnummerVoorvoegsel: "FACT-",
```
Het volledige nummer wordt: `OFF-2026-0001`, `OFF-2026-0002`, enzovoort. Wil je bijvoorbeeld geen jaartal erin? Pas dat dan aan in `server.js` (zoek naar `offertenummer = `).

### 5.7 Geldigheidsduur offerte / betaaltermijn factuur

```js
offerteGeldigheidDagen: 30,
factuurBetaaltermijnDagen: 14,
```

### 5.8 Kleuren en lettertype (huisstijl)

In **`public/css/stijl.css`**, bovenaan:
```css
:root {
  --goud: #b8862b;
  --goud-licht: #d9a75c;
  --zwart: #14120f;
  ...
}
```
Pas deze kleurcodes aan om de huisstijl te wijzigen — dit werkt overal in de app door (knoppen, formulier, offerte, factuur).

---

## 6. Hoe werkt het automatisch nummeren en opslaan?

- Elke offerte/factuur wordt opgeslagen in **`data/offertes.json`** — een gewoon tekstbestand, geen ingewikkelde database. Prima voor een klein bedrijf met overzichtelijke aantallen offertes.
- **`data/teller.json`** onthoudt het laatste gebruikte offerte- en factuurnummer, zodat elk nieuw nummer automatisch één hoger is.
- Wil je alles resetten (bijv. na het testen)? Zet de inhoud van `data/offertes.json` terug naar `[]` en `data/teller.json` naar `{"offerte": 0, "factuur": 0}`.

**Tip:** maak af en toe een kopie van de map `data/` ergens anders op je computer, zodat je nooit offertes/facturen kwijt kunt raken.

---

## 7. Later uitbreiden: e-mail versturen

Op dit moment download je de PDF handmatig en stuur je die zelf naar de klant. Wil je dit automatiseren?

1. Installeer een e-mail package, bijvoorbeeld [Nodemailer](https://nodemailer.com/):
   ```
   npm install nodemailer
   ```
2. In `server.js` kun je dan, bijvoorbeeld na het aanmaken van een offerte, een e-mail versturen met een link naar `/offerte/:id`, of de PDF als bijlage (de PDF zou je dan server-side moeten genereren, bijvoorbeeld met het package `puppeteer` dat een PDF-bestand maakt van de HTML-pagina in plaats van de browser-printfunctie).
3. Voor een verzendadres heb je meestal SMTP-gegevens van je eigen e-mailprovider nodig (bijv. de instellingen die je ook in Outlook/Gmail zou gebruiken), of een dienst zoals Postmark, Resend of SendGrid.

Dit is bewust nog niet ingebouwd, om de MVP simpel te houden — maar de basis (`config.js` met je e-mailadres, en een duidelijk afgebakend punt in `server.js` waar de offerte wordt aangemaakt) is er al klaar voor.

## 8. Later uitbreiden: online betalen

Wil je dat klanten direct online kunnen betalen vanuit de factuur?

1. Maak een account aan bij een Nederlandse betaalprovider die makkelijk te integreren is, bijvoorbeeld **Mollie** (ondersteunt iDEAL) of **Stripe**.
2. Installeer hun Node.js package, bijvoorbeeld:
   ```
   npm install @mollie/api-client
   ```
3. In `server.js`, bij de route die de factuur toont (`/offerte/:id`), zou je een betaal-link kunnen aanmaken via hun API en die als knop tonen naast "Download factuur als PDF".
4. De betaalprovider stuurt na betaling een melding (webhook) naar je server, waarmee je de factuur in `data/offertes.json` kan markeren als "betaald" (je zou daarvoor een extra veld `betaald: true/false` aan elk record kunnen toevoegen in `storage.js`).

Ook dit is bewust weggelaten in de MVP — eerst zorgen dat offertes/facturen goed werken, dan pas betalingen erbij.

---

## 9. Veelgestelde vragen

**Werkt dit ook op mijn telefoon/tablet?**
Ja, zolang je naar het IP-adres van de computer waarop de server draait surft (in plaats van `localhost`), op hetzelfde wifi-netwerk. Voor gebruik buiten je eigen netwerk (bijv. door klanten zelf) heb je later hosting nodig (bijvoorbeeld op een dienst zoals Render.com of een VPS) — dat is een vervolgstap, niet nodig voor lokaal gebruik.

**Kan ik oude offertes nog terugvinden?**
Ja, via "Overzicht offertes & facturen" rechtsboven op de hoofdpagina.

**De PDF ziet er anders uit dan op het scherm — hoe komt dat?**
De pagina gebruikt speciale "print-stijl" (zie `public/css/document.css`, onderaan bij `@media print`) om knoppen te verbergen tijdens het printen/PDF maken. Dat is gewenst gedrag.

**Ik wil een ander lettertype.**
Pas de regels `--font-display` en `--font-body` aan in `public/css/stijl.css`.

---

Veel succes met Don Vloeren! 🛠️
