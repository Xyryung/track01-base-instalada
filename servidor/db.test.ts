import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Extraction } from '../src/lib/types.js'

process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), 'atlas-db-')), 'test.db')
const { db, listObservations, saveObservation } = await import('./db.js')

function extraction(client: string, modality: string, quantity: number | null): Extraction {
  return { client, city: 'Ciudad de Panamá', country: 'Panamá', modality, quantity, brand: null, model: null, ageYears: null, confidence: 0.9 }
}

function statuses(client: string) {
  return listObservations().filter((item) => item.client === client).map((item) => `${item.author}:${item.status}`).sort()
}

describe('estados entre autores al guardar', () => {
  it('propaga el estado a todo el grupo con tres o más autores', () => {
    db.exec('DELETE FROM observations')
    saveObservation('Ana', 'texto', extraction('San Gabriel', 'Tomografía', 2))
    expect(statuses('San Gabriel')).toEqual(['Ana:observado'])

    saveObservation('Luis', 'texto', extraction('San Gabriel', 'Tomografía', 2))
    expect(statuses('San Gabriel')).toEqual(['Ana:confirmado', 'Luis:confirmado'])

    // Un tercer autor discrepa: las tres filas pasan a conflicto, no solo dos.
    saveObservation('Marta', 'texto', extraction('San Gabriel', 'Tomografía', 3))
    expect(statuses('San Gabriel')).toEqual(['Ana:conflicto', 'Luis:conflicto', 'Marta:conflicto'])

    // Marta vuelve a visitar y corrige: cuenta su última observación y el grupo se confirma.
    saveObservation('Marta', 'texto', extraction('San Gabriel', 'Tomografía', 2))
    expect(statuses('San Gabriel')).toEqual(['Ana:confirmado', 'Luis:confirmado', 'Marta:confirmado', 'Marta:confirmado'])
  })

  it('reconoce el mismo equipo aunque el modelo lo describa distinto', () => {
    db.exec('DELETE FROM observations')
    saveObservation('Ana', 'texto', extraction('San Gabriel', 'Tomografía', 2))
    const saved = saveObservation('Pedro', 'texto', extraction('Hospital San Gabriel', 'tomografos', 2))
    expect(saved.client).toBe('San Gabriel')
    expect(saved.modality).toBe('Tomografía')
    expect(statuses('San Gabriel')).toEqual(['Ana:confirmado', 'Pedro:confirmado'])
  })

  it('el mismo autor repetido no confirma nada', () => {
    db.exec('DELETE FROM observations')
    saveObservation('Ana', 'texto', extraction('Horizonte', 'Resonancia magnética', 1))
    saveObservation('Ana', 'texto', extraction('Horizonte', 'Resonancia magnética', 1))
    expect(statuses('Horizonte')).toEqual(['Ana:observado', 'Ana:observado'])
  })
})
