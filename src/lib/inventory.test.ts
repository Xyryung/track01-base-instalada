import { describe, expect, it } from 'vitest'
import { consolidateEquipment, statusForGroup, worstStatus } from './inventory.js'
import type { Observation } from './types.js'

let nextId = 1
function observation(author: string, client: string | null, modality: string | null, quantity: number | null, extra: Partial<Observation> = {}): Observation {
  return {
    id: nextId++, author, sourceText: '', status: 'observado', createdAt: '2026-09-11 00:00:00',
    client, city: null, country: null, modality, quantity, brand: null, model: null, ageYears: null,
    confidence: 0.9, missing: [], followUp: null, ...extra,
  }
}

describe('estado de un grupo (cliente, modalidad)', () => {
  it('un solo autor queda observado', () => {
    expect(statusForGroup([{ id: 1, author: 'Ana', quantity: 2 }])).toBe('observado')
  })
  it('dos autores que coinciden confirman', () => {
    expect(statusForGroup([{ id: 1, author: 'Ana', quantity: 2 }, { id: 2, author: 'Luis', quantity: 2 }])).toBe('confirmado')
  })
  it('tres autores: dos coinciden y uno no → conflicto para todo el grupo', () => {
    expect(statusForGroup([
      { id: 1, author: 'Ana', quantity: 2 }, { id: 2, author: 'Luis', quantity: 2 }, { id: 3, author: 'Marta', quantity: 3 },
    ])).toBe('conflicto')
  })
  it('cuenta la última observación de cada autor: una corrección resuelve el conflicto', () => {
    expect(statusForGroup([
      { id: 1, author: 'Ana', quantity: 2 }, { id: 2, author: 'Marta', quantity: 3 }, { id: 3, author: 'Marta', quantity: 2 },
    ])).toBe('confirmado')
  })
  it('un autor sin cantidad no confirma ni contradice', () => {
    expect(statusForGroup([{ id: 1, author: 'Ana', quantity: 2 }, { id: 2, author: 'Luis', quantity: null }])).toBe('observado')
  })
})

describe('inventario consolidado', () => {
  it('dos observaciones que se confirman cuentan una sola vez', () => {
    const groups = consolidateEquipment([
      observation('Ana', 'San Gabriel', 'Tomografía', 2),
      observation('Luis', 'San Gabriel', 'Tomografía', 2),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].quantity).toBe(2)
    expect(groups[0].status).toBe('confirmado')
    expect(groups[0].authors).toHaveLength(2)
  })

  it('dos observaciones en conflicto no se suman: se muestra la más reciente', () => {
    const groups = consolidateEquipment([
      observation('Ana', 'San Gabriel', 'Tomografía', 2),
      observation('Marta', 'San Gabriel', 'Tomografía', 3),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].quantity).toBe(3)
    expect(groups[0].status).toBe('conflicto')
  })

  it('clientes distintos son equipos distintos', () => {
    const groups = consolidateEquipment([
      observation('Ana', 'San Gabriel', 'Tomografía', 2),
      observation('Ana', 'Horizonte', 'Tomografía', 1),
    ])
    expect(groups).toHaveLength(2)
    expect(groups.reduce((sum, group) => sum + (group.quantity ?? 0), 0)).toBe(3)
  })

  it('agrupa aunque cambien mayúsculas o acentos', () => {
    const groups = consolidateEquipment([
      observation('Ana', 'San Gabriel', 'Tomografía', 2),
      observation('Luis', 'san gabriel', 'tomografia', 2),
    ])
    expect(groups).toHaveLength(1)
  })

  it('sin cliente o modalidad no mezcla observaciones desconocidas', () => {
    const groups = consolidateEquipment([
      observation('Ana', null, 'Tomografía', 2),
      observation('Luis', null, 'Tomografía', 5),
    ])
    expect(groups).toHaveLength(2)
  })

  it('completa marca y modelo con la primera fuente que los tenga', () => {
    const groups = consolidateEquipment([
      observation('Ana', 'San Gabriel', 'Tomografía', 2, { brand: 'MedNova', model: 'CT-4' }),
      observation('Luis', 'San Gabriel', 'Tomografía', 2),
    ])
    expect(groups[0].brand).toBe('MedNova')
    expect(groups[0].model).toBe('CT-4')
  })
})

describe('estado más exigente', () => {
  it('un conflicto pesa más que una confirmación', () => {
    expect(worstStatus([{ status: 'confirmado' }, { status: 'conflicto' }])).toBe('conflicto')
    expect(worstStatus([{ status: 'confirmado' }, { status: 'observado' }])).toBe('confirmado')
    expect(worstStatus([{ status: 'observado' }])).toBe('observado')
  })
})
