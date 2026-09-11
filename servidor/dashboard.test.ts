import { describe, expect, it } from 'vitest'
import type { Observation } from '../src/lib/types.js'
import { buildDashboard } from './dashboard.js'

let nextId = 1
function observation(author: string, client: string, modality: string, quantity: number, city = 'Ciudad de Panamá'): Observation {
  return {
    id: nextId++, author, sourceText: '', status: 'observado', createdAt: '2026-09-11 00:00:00',
    client, city, country: 'Panamá', modality, quantity, brand: null, model: null, ageYears: null,
    confidence: 0.9, missing: [], followUp: null,
  }
}

describe('dashboard sin doble conteo', () => {
  it('dos autores que confirman el mismo equipo cuentan una vez', () => {
    const data = buildDashboard([
      observation('Ana', 'San Gabriel', 'Tomografía', 2),
      observation('Luis', 'San Gabriel', 'Tomografía', 2),
    ])
    expect(data.totals.equipment).toBe(2)
    expect(data.totals.confirmed).toBe(1)
    expect(data.byModality).toEqual([{ label: 'Tomografía', value: 2 }])
    expect(data.byCity).toEqual([{ label: 'Ciudad de Panamá', value: 2 }])
  })

  it('un conflicto no suma ambas cantidades', () => {
    const data = buildDashboard([
      observation('Ana', 'San Gabriel', 'Tomografía', 2),
      observation('Marta', 'San Gabriel', 'Tomografía', 3),
    ])
    expect(data.totals.equipment).toBe(3)
    expect(data.totals.conflicts).toBe(1)
    expect(data.totals.confirmed).toBe(0)
  })

  it('equipos de clientes distintos sí se suman', () => {
    const data = buildDashboard([
      observation('Ana', 'San Gabriel', 'Tomografía', 2),
      observation('Ana', 'Horizonte', 'Resonancia magnética', 1, 'David'),
      observation('Ana', 'Del Pacífico', 'Rayos X', 3, 'Colón'),
    ])
    expect(data.totals.equipment).toBe(6)
    expect(data.totals.clients).toBe(3)
    expect(data.byCountry).toEqual([{ label: 'Panamá', value: 6 }])
  })
})
