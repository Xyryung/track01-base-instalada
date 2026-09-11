import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { EquipmentStatus, Extraction, Observation } from '../src/lib/types.js'
import { followUpFor, missingFields } from '../src/lib/extract.js'
import { canonicalClient, canonicalModality, matchKey } from '../src/lib/normalize.js'
import { statusForGroup } from '../src/lib/inventory.js'

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
    client: canonicalClient(row.client as string | null), city: row.city as string | null,
    country: row.country as string | null, modality: canonicalModality(row.modality as string | null),
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

export function saveObservation(author: string, sourceText: string, extraction: Extraction) {
  const data: Extraction = {
    ...extraction,
    client: canonicalClient(extraction.client),
    modality: canonicalModality(extraction.modality),
  }
  const transaction = db.transaction(() => {
    // Se compara con claves normalizadas (sin acentos ni prefijo de institución)
    // para que "Hospital San Gabriel / tomografos" coincida con "San Gabriel / Tomografía".
    const clientKey = matchKey(data.client)
    const modalityKey = matchKey(data.modality)
    const candidates = clientKey && modalityKey
      ? (db.prepare('SELECT * FROM observations WHERE client IS NOT NULL AND modality IS NOT NULL').all() as Row[])
          .filter((row) => matchKey(canonicalClient(row.client as string)) === clientKey && matchKey(canonicalModality(row.modality as string)) === modalityKey)
      : []
    const result = db.prepare(`INSERT INTO observations
      (author, source_text, client, city, country, modality, quantity, brand, model, age_years, confidence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(author, sourceText, data.client, data.city, data.country, data.modality, data.quantity, data.brand, data.model, data.ageYears, data.confidence, 'observado')
    const id = Number(result.lastInsertRowid)
    // El estado se recalcula para TODO el grupo (cliente, modalidad) con la última
    // observación de cada autor, no solo para el primer par que coincide: con tres o
    // más autores todas las filas quedan coherentes entre sí.
    const group = [...candidates, { id, author, quantity: data.quantity }]
    const status: EquipmentStatus = statusForGroup(group.map((row) => ({
      id: Number(row.id), author: String(row.author), quantity: row.quantity == null ? null : Number(row.quantity),
    })))
    const update = db.prepare('UPDATE observations SET status = ? WHERE id = ?')
    for (const row of group) update.run(status, row.id)
    return id
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
