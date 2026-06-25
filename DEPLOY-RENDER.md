# Don Vloeren app online zetten via Render (stap voor stap)

Deze handleiding zet je app live op een eigen URL, bijvoorbeeld:
**`https://donvloeren-app.onrender.com`**

Je hoeft niets te installeren op je Chromebook. Alles gebeurt via de browser, op twee gratis websites: **GitHub** (waar je code "woont") en **Render** (waar je app draait).

Reken op ongeveer **15-20 minuten** de eerste keer.

---

## Overzicht van de stappen

1. Account maken op GitHub (gratis)
2. Je projectmap uploaden naar GitHub (zonder Git-commando's, via de website)
3. Account maken op Render (gratis)
4. Render koppelen aan je GitHub-project
5. Klaar — je krijgt een URL

---

## Stap 1 — Account maken op GitHub

1. Ga naar **https://github.com/signup**
2. Maak een gratis account (e-mailadres + wachtwoord + gebruikersnaam)
3. Rond de verificatie af (ze sturen een code naar je e-mail)

GitHub is simpelweg de plek waar je projectbestanden online staan, zodat Render ze kan ophalen.

---

## Stap 2 — Je project op GitHub zetten

Je hoeft hier **geen** Git of terminal-commando's voor te gebruiken — dit gaat volledig via slepen-en-klikken in de browser.

1. Pak eerst de zip van je project uit op je Chromebook (in de Bestanden-app: rechtsklik op de zip → "Uitpakken").
2. Ga op GitHub naar **https://github.com/new**
3. Vul in:
   - **Repository name**: bijvoorbeeld `donvloeren-app`
   - Laat "Public" aangevinkt staan (gratis Render werkt het makkelijkst met een publieke repo — je broncode is dan voor iedereen leesbaar, maar er staan geen wachtwoorden in je code, dus dat is geen probleem)
   - Vink **niet** "Add a README file" aan (je hebt er zelf al een)
4. Klik op **"Create repository"**
5. Op de volgende pagina zie je een link **"uploading an existing file"** — klik daarop
6. Sleep **alle bestanden en mappen** uit je uitgepakte `donvloeren-app`-map naar het uploadvak in de browser
   - Tip: open de Bestanden-app naast je browser, selecteer alles in de map (Ctrl+A), en sleep het geheel naar het browservenster.
   - **Let op:** upload de *inhoud* van de map `donvloeren-app`, niet de map zelf (dus niet één map die alles bevat, maar de bestanden `server.js`, `config.js`, de map `public`, enzovoort, los).
   - **Sleep mappen (zoals `public` en `data`) gewoon mee** — moderne Chrome-versies ondersteunen het uploaden van hele mappen via deze pagina. Zie je na het slepen niet alle bestanden terug (bijv. mist `public/css/stijl.css`), upload dan die ontbrekende map of bestanden gewoon nogmaals apart via dezelfde "uploading an existing file"-pagina, zo vaak als nodig — je kan meerdere keren uploaden voordat je op "Commit changes" klikt.
7. Scroll naar onder, vul een berichtje in bij "Commit changes" (bijv. "Eerste versie"), en klik op **"Commit changes"**

Je bestanden staan nu online op GitHub. Je kunt dit altijd terugvinden via `https://github.com/JOUW-GEBRUIKERSNAAM/donvloeren-app`.

---

## Stap 3 — Account maken op Render

1. Ga naar **https://render.com**
2. Klik op **"Get Started"** of **"Sign Up"**
3. Kies **"Sign up with GitHub"** — dit is het makkelijkst, want dan worden je GitHub- en Render-account meteen gekoppeld
4. Geef Render toestemming om bij je GitHub-account te mogen (een standaard goedkeuringsscherm)

---

## Stap 4 — Je app aanmaken op Render

1. Klik in het Render-dashboard op **"New +"** rechtsboven, en kies **"Web Service"**
2. Zoek en selecteer je repository **`donvloeren-app`** uit de lijst (verbind eventueel eerst je GitHub-account als dat nog niet gebeurd is — Render vraagt daar zelf om)
3. Render herkent automatisch het bestand `render.yaml` dat in je project zit, en vult de instellingen al voor je in. Controleer dat het ongeveer zo uitziet:
   - **Name**: `donvloeren-app` (of een naam van jouw keuze — dit wordt deel van je uiteindelijke URL)
   - **Region**: kies bijvoorbeeld **Frankfurt (EU Central)** — het dichtst bij Nederland
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**
4. Klik onderaan op **"Create Web Service"** (of "Deploy Web Service")

Render gaat nu automatisch:
- je code ophalen van GitHub
- `npm install` draaien (Express installeren)
- de server starten

Dit duurt de eerste keer ongeveer **2-5 minuten**. Je ziet live een logboek voorbijkomen. Zodra je onderin tekst ziet zoals:
```
Server draait op poort 10000
==========================================
```
en daarboven **"Your service is live"** verschijnt, is de app online.

---

## Stap 5 — Je app openen

Boven in het Render-dashboard, bij je service, staat een URL zoals:

**`https://donvloeren-app.onrender.com`**

Klik erop (of plak het in Chrome op je Chromebook). Je ziet het offerte-formulier — exact zoals lokaal, maar nu gewoon een normale website die je overal kan openen.

Je kunt deze URL favorieten/bookmarken in Chrome, of als snelkoppeling op je Chromebook-startscherm zetten ("Voeg toe aan startscherm" in het Chrome-menu) zodat het bijna als een eigen app aanvoelt.

---

## Belangrijk om te weten: opslag van offertes/facturen

Dit is de **enige** technische beperking van het gratis Render-plan die je moet kennen:

> Op het **gratis plan** wordt het bestand `data/offertes.json` (waar je offertes/facturen in staan) **gereset** zodra je een nieuwe versie deployt (bijv. na het aanpassen van `config.js` en opnieuw uploaden naar GitHub), én soms ook automatisch na een periode van inactiviteit, omdat Render de gratis server dan "in slaap" zet en bij het wakker worden een schone schijf gebruikt.

**Wat betekent dit voor jou in de praktijk?**
- Voor het **maken en direct downloaden** van een offerte/factuur als PDF werkt alles altijd gewoon goed — dat proces gebeurt allemaal binnen één sessie.
- Het **overzicht** ("Overzicht offertes & facturen") kan na een tijdje leeg zijn als de server opnieuw is opgestart. Download dus altijd de PDF zodra je een offerte/factuur maakt, en bewaar die zelf (bijv. in Google Drive) — vertrouw niet op het overzicht als permanente opslag.

**Hoe je dit kunt oplossen (optioneel, voor later):**
- Upgrade naar een betaald Render-plan met een **"Persistent Disk"** (vanaf ca. $7/maand) — dan blijft `data/offertes.json` altijd bewaard, ook na deploys/herstarts.
- Of: laat me weten of je een "echte" database wil (bijvoorbeeld Render's eigen gratis PostgreSQL-database) — dat is een vervolgstap die ik voor je kan inbouwen, los van wat je nu hebt.

Voor een MVP die je nu wil testen en gebruiken is dit prima zo — je hoeft dus niets te doen, alleen te onthouden: **download je PDF's** in plaats van te vertrouwen op het overzichtsscherm.

---

## Latere aanpassingen: hoe werkt dat online?

Wil je later iets aanpassen (bijv. een prijs in `config.js`, of het logo)?

1. Ga naar je repository op GitHub (`https://github.com/JOUW-GEBRUIKERSNAAM/donvloeren-app`)
2. Klik op het bestand dat je wil aanpassen (bijv. `config.js`)
3. Klik op het potloodje (✏️) rechtsboven om te bewerken
4. Pas de tekst aan, scroll naar onder, klik op **"Commit changes"**
5. Render ziet automatisch dat er iets veranderd is op GitHub, en deployt binnen een paar minuten automatisch een nieuwe versie — je hoeft niets aan te klikken op Render zelf.

Wil je het logo vervangen?
1. Ga naar de map `public/images` in je GitHub-repository
2. Klik op `logo.png`, dan op het prullenbak-icoon om te verwijderen (of: klik "Add file" → "Upload files" om een nieuw bestand met dezelfde naam te uploaden, wat het oude vervangt)
3. Commit de wijziging — Render deployt automatisch opnieuw

---

## Hulp nodig?

Als de "Logs" pagina op Render een foutmelding toont, kopieer die tekst en stuur die naar mij — dan help ik je verder met exact dat probleem.
