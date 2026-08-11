const fs = require("fs");
const path = require("path");
const DATA_DIR = path.join(__dirname, "data");
const OFFERTES_FILE = path.join(DATA_DIR, "offertes.json");
const TELLER_FILE = path.join(DATA_DIR, "teller.json");

function zorgDatBestandenBestaan() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(OFFERTES_FILE)) fs.writeFileSync(OFFERTES_FILE, "[]", "utf-8");
  if (!fs.existsSync(TELLER_FILE)) fs.writeFileSync(TELLER_FILE, JSON.stringify({ offerte: 0, factuur: 0 }, null, 2), "utf-8");
}
function leesAlleOffertes() { zorgDatBestandenBestaan(); return JSON.parse(fs.readFileSync(OFFERTES_FILE, "utf-8")); }
function schrijfAlleOffertes(lijst) { fs.writeFileSync(OFFERTES_FILE, JSON.stringify(lijst, null, 2), "utf-8"); }
function vindOfferteOpId(id) { return leesAlleOffertes().find((o) => o.id === id); }
function voegOfferteToe(offerte) { const lijst = leesAlleOffertes(); lijst.push(offerte); schrijfAlleOffertes(lijst); return offerte; }
function updateOfferte(id, wijzigingen) { const lijst = leesAlleOffertes(); const index = lijst.findIndex((o) => o.id === id); if (index === -1) return null; lijst[index] = { ...lijst[index], ...wijzigingen }; schrijfAlleOffertes(lijst); return lijst[index]; }
function leesToeller() { zorgDatBestandenBestaan(); return JSON.parse(fs.readFileSync(TELLER_FILE, "utf-8")); }
function volgendNummer(soort) { zorgDatBestandenBestaan(); const teller = JSON.parse(fs.readFileSync(TELLER_FILE, "utf-8")); teller[soort] = (teller[soort] || 0) + 1; fs.writeFileSync(TELLER_FILE, JSON.stringify(teller, null, 2), "utf-8"); return teller[soort]; }
function offertenummerBestaatAl(nummer) { return leesAlleOffertes().some((o) => o.offertenummer === nummer || o.factuurnummer === nummer); }
module.exports = { leesAlleOffertes, vindOfferteOpId, voegOfferteToe, updateOfferte, leesToeller, volgendNummer, offertenummerBestaatAl };
