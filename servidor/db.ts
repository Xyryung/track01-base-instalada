import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { EquipmentStatus, Extraction, Observation } from '../src/lib/types.js'
import { followUpFor, missingFields } from '../src/lib/extract.js'

const dbPath = resolve(process.env.DB_PATH ?? 'data/base-instalada.db')
mkdirSync(dirname(dbPath), { recursive: true })
export const db: Database.Database = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    source_text TEXT NOT NULL,
    client TEXT, city TEXT, country TEXT, modality TEXT,
    quantity INTEGER, brand TEXT, model TEXT, age_years REAL,
    confidence REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'observado',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_observations_client_modality ON observations(client, modality);
  CREATE INDEX IF NOT EXISTS idx_observations_status ON observations(status);
`)

type Row = Record<string, string | number | null>
function mapRow(row: Row): Observation {
  const extraction: Extraction = {
    client: row.client as string | null, city: row.city as string | null,
    country: row.country as string | null, modality: row.modality as string | null,
    quantity: row.quantity as number | null, brand: row.brand as string | null,
    model: row.model as string | null, ageYears: row.age_years as number | null,
    confidence: Number(row.confidence),
  }
  return {
    id: Number(row.id), author: String(row.author), sourceText: String(row.source_text),
    status: row.status as EquipmentStatus, createdAt: String(row.created_at),
    ...extraction, missing: missingFields(extraction), followUp: followUpFor(extraction),
  }
}

export function listObservations() {
  return (db.prepare('SELECT * FROM observations ORDER BY id DESC').all() as Row[]).map(mapRow)
}

export function saveObservation(author: string, sourceText: string, data: Extraction) {
  const transaction = db.transaction(() => {
    const candidates = db.prepare(`SELECT * FROM observations WHERE lower(client) = lower(?) AND lower(modality) = lower(?) AND id != ?`).all(data.client, data.modality, -1) as Row[]
    let status: EquipmentStatus = 'observado'
    const independent = candidates.find((row) => row.author !== author)
    if (independent) status = Number(independent.quantity) === data.quantity ? 'confirmado' : 'conflicto'
    const result = db.prepare(`INSERT INTO observations
      (author, source_text, client, city, country, modality, quantity, brand, model, age_years, confidence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(author, sourceText, data.client, data.city, data.country, data.modality, data.quantity, data.brand, data.model, data.ageYears, data.confidence, status)
    if (independent) db.prepare('UPDATE observations SET status = ? WHERE id = ?').run(status, independent.id)
    return Number(result.lastInsertRowid)
  })
  const id = transaction()
  return mapRow(db.prepare('SELECT * FROM observations WHERE id = ?').get(id) as Row)
}

export function seedDemo() {
  if ((db.prepare('SELECT count(*) AS count FROM observations').get() as { count: number }).count) return
  const demos: [string, string, Extraction][] = [
    ['Ana M.', 'Hospital San Gabriel en Ciudad de Panamá tiene 2 tomógrafos marca MedNova modelo CT-4 desde hace 3 años.', { client:'San Gabriel', city:'Ciudad de Panamá', country:'Panamá', modality:'Tomografía', quantity:2, brand:'MedNova', model:'CT-4', ageYears:3, confidence:.94 }],
    ['Luis R.', 'Vi 2 tomógrafos marca MedNova modelo CT-4 en Hospital San Gabriel de Panamá.', { client:'San Gabriel', city:'Ciudad de Panamá', country:'Panamá', modality:'Tomografía', quantity:2, brand:'MedNova', model:'CT-4', ageYears:null, confidence:.91 }],
    ['Marta V.', 'Clínica Horizonte en David tiene 1 resonancia marca Auralis modelo MR-7 hace 5 años.', { client:'Horizonte', city:'David', country:'Panamá', modality:'Resonancia magnética', quantity:1, brand:'Auralis', model:'MR-7', ageYears:5, confidence:.92 }],
    ['Carlos P.', 'Hospital del Pacífico en Colón: 3 equipos de rayos X marca Lumex.', { client:'Del Pacífico', city:'Colón', country:'Panamá', modality:'Rayos X', quantity:3, brand:'Lumex', model:null, ageYears:null, confidence:.83 }],
  ]
  for (const demo of demos) saveObservation(...demo)
}
