/* =========================================================================
   STORAGE.JS — Database opslag via PostgreSQL
   =========================================================================
   Gebruikt de omgevingsvariabele DATABASE_URL (wordt automatisch ingevuld
   door Render zodra je een database koppelt aan je web service).
   
   Valt automatisch terug op het oude JSON-bestand systeem als er geen
   DATABASE_URL beschikbaar is (handig voor lokaal testen).
   ========================================================================= */

const fs = require("fs");
const path = require("path");

// ---- Bepaal opslagmethode ----
const gebruikDatabase = !!process.env.DATABASE_URL;

// ---- PostgreSQL verbinding (alleen laden als DATABASE_URL aanwezig is) ----
let pool;
if (gebruikDatabase) {
  const { Pool } = require("pg"); // lazy laden — alleen nodig met echte database
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

// ---- Fallback: JSON bestanden (voor lokaal gebruik zonder database) ----
const DATA_DIR = path.join(__dirname, "data");
const OFFERTES_FILE = path.join(DATA_DIR, "offertes.json");
const TELLER_FILE = path.join(DATA_DIR, "teller.json");

function zorgDatBestandenBestaan() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(OFFERTES_FILE)) fs.writeFileSync(OFFERTES_FILE, "[]", "utf-8");
  if (!fs.existsSync(TELLER_FILE)) fs.writeFileSync(TELLER_FILE, JSON.stringify({ offerte: 0, factuur: 0 }, null, 2), "utf-8");
}

// =========================================================================
// DATABASE INITIALISATIE
// Maakt de tabellen aan als ze nog niet bestaan.
// Wordt automatisch aangeroepen bij het opstarten van de server.
// =========================================================================
async function initialiseerDatabase() {
  if (!gebruikDatabase) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS offertes (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'offerte',
        offertenummer TEXT UNIQUE,
        factuurnummer TEXT UNIQUE,
        aangemaaktop TIMESTAMPTZ,
        geldigtot TIMESTAMPTZ,
        factuurdatum TIMESTAMPTZ,
        vervaldatum TIMESTAMPTZ,
        klant JSONB,
        klus JSONB,
        berekening JSONB,
        gewijzigd TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS teller (
        soort TEXT PRIMARY KEY,
        waarde INTEGER NOT NULL DEFAULT 0
      );
    `);
    // Zorg dat de teller-rijen bestaan
    await client.query(`
      INSERT INTO teller (soort, waarde) VALUES ('offerte', 0), ('factuur', 0)
      ON CONFLICT (soort) DO NOTHING;
    `);
    console.log("Database tabellen klaar.");
  } finally {
    client.release();
  }
}

// =========================================================================
// OFFERTES LEZEN
// =========================================================================
async function leesAlleOffertes() {
  if (!gebruikDatabase) {
    zorgDatBestandenBestaan();
    return JSON.parse(fs.readFileSync(OFFERTES_FILE, "utf-8"));
  }
  const result = await pool.query(
    "SELECT * FROM offertes ORDER BY aangemaaktop ASC"
  );
  return result.rows.map(rijNaarRecord);
}

async function vindOfferteOpId(id) {
  if (!gebruikDatabase) {
    zorgDatBestandenBestaan();
    const lijst = JSON.parse(fs.readFileSync(OFFERTES_FILE, "utf-8"));
    return lijst.find((o) => o.id === id);
  }
  const result = await pool.query(
    "SELECT * FROM offertes WHERE id = $1", [id]
  );
  return result.rows.length ? rijNaarRecord(result.rows[0]) : null;
}

// =========================================================================
// OFFERTE OPSLAAN
// =========================================================================
async function voegOfferteToe(record) {
  if (!gebruikDatabase) {
    zorgDatBestandenBestaan();
    const lijst = JSON.parse(fs.readFileSync(OFFERTES_FILE, "utf-8"));
    lijst.push(record);
    fs.writeFileSync(OFFERTES_FILE, JSON.stringify(lijst, null, 2), "utf-8");
    return record;
  }
  await pool.query(`
    INSERT INTO offertes
      (id, status, offertenummer, factuurnummer, aangemaaktop, geldigtot,
       factuurdatum, vervaldatum, klant, klus, berekening)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  `, [
    record.id,
    record.status,
    record.offertenummer || null,
    record.factuurnummer || null,
    record.aangemaaktOp || null,
    record.geldigTot || null,
    record.factuurdatum || null,
    record.vervaldatum || null,
    JSON.stringify(record.klant),
    JSON.stringify(record.klus),
    JSON.stringify(record.berekening),
  ]);
  return record;
}

// =========================================================================
// OFFERTE BIJWERKEN (bijv. bij akkoord → factuur)
// =========================================================================
async function updateOfferte(id, wijzigingen) {
  if (!gebruikDatabase) {
    zorgDatBestandenBestaan();
    const lijst = JSON.parse(fs.readFileSync(OFFERTES_FILE, "utf-8"));
    const index = lijst.findIndex((o) => o.id === id);
    if (index === -1) return null;
    lijst[index] = { ...lijst[index], ...wijzigingen };
    fs.writeFileSync(OFFERTES_FILE, JSON.stringify(lijst, null, 2), "utf-8");
    return lijst[index];
  }
  // Bouw dynamisch de SET-clausule op uit de wijzigingen
  const kolomMap = {
    status: "status",
    factuurnummer: "factuurnummer",
    factuurdatum: "factuurdatum",
    vervaldatum: "vervaldatum",
    offertenummer: "offertenummer",
  };
  const sets = [];
  const waarden = [];
  let i = 1;
  for (const [sleutel, kolom] of Object.entries(kolomMap)) {
    if (sleutel in wijzigingen) {
      sets.push(`${kolom} = $${i}`);
      waarden.push(wijzigingen[sleutel]);
      i++;
    }
  }
  if (sets.length === 0) return vindOfferteOpId(id);
  sets.push(`gewijzigd = NOW()`);
  waarden.push(id);
  await pool.query(
    `UPDATE offertes SET ${sets.join(", ")} WHERE id = $${i}`,
    waarden
  );
  return vindOfferteOpId(id);
}

// =========================================================================
// TELLER (offertenummers en factuurnummers bijhouden)
// =========================================================================
async function leesToeller() {
  if (!gebruikDatabase) {
    zorgDatBestandenBestaan();
    return JSON.parse(fs.readFileSync(TELLER_FILE, "utf-8"));
  }
  const result = await pool.query("SELECT soort, waarde FROM teller");
  const teller = {};
  result.rows.forEach((r) => { teller[r.soort] = r.waarde; });
  return teller;
}

async function volgendNummer(soort) {
  if (!gebruikDatabase) {
    zorgDatBestandenBestaan();
    const teller = JSON.parse(fs.readFileSync(TELLER_FILE, "utf-8"));
    teller[soort] = (teller[soort] || 0) + 1;
    fs.writeFileSync(TELLER_FILE, JSON.stringify(teller, null, 2), "utf-8");
    return teller[soort];
  }
  // Atomische increment (voorkomt dubbele nummers bij gelijktijdig gebruik)
  const result = await pool.query(
    "UPDATE teller SET waarde = waarde + 1 WHERE soort = $1 RETURNING waarde",
    [soort]
  );
  return result.rows[0].waarde;
}

// =========================================================================
// DUPLICATE CHECK
// =========================================================================
async function offertenummerBestaatAl(nummer) {
  if (!gebruikDatabase) {
    zorgDatBestandenBestaan();
    const lijst = JSON.parse(fs.readFileSync(OFFERTES_FILE, "utf-8"));
    return lijst.some((o) => o.offertenummer === nummer || o.factuurnummer === nummer);
  }
  const result = await pool.query(
    "SELECT 1 FROM offertes WHERE offertenummer = $1 OR factuurnummer = $1 LIMIT 1",
    [nummer]
  );
  return result.rows.length > 0;
}

// =========================================================================
// HULPFUNCTIE: database-rij omzetten naar het bekende record-formaat
// =========================================================================
function rijNaarRecord(rij) {
  return {
    id: rij.id,
    status: rij.status,
    offertenummer: rij.offertenummer,
    factuurnummer: rij.factuurnummer,
    aangemaaktOp: rij.aangemaaktop,
    geldigTot: rij.geldigtot,
    factuurdatum: rij.factuurdatum,
    vervaldatum: rij.vervaldatum,
    klant: rij.klant,
    klus: rij.klus,
    berekening: rij.berekening,
  };
}

module.exports = {
  initialiseerDatabase,
  leesAlleOffertes,
  vindOfferteOpId,
  voegOfferteToe,
  updateOfferte,
  leesToeller,
  volgendNummer,
  offertenummerBestaatAl,
};
