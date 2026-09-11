import { describe, expect, it } from 'vitest'
import { followUpFor, missingFields } from './extract.js'
import type { Extraction } from './types.js'

describe('seguimiento de la extracción QVAC', () => {
  it('mantiene vacíos los datos ausentes y prioriza una sola pregunta', () => {
    const result: Extraction = {
      client: null, city: null, country: null, modality: 'Tomografía',
      quantity: 1, brand: null, model: null, ageYears: null, confidence: 0.72,
    }
    expect(result.client).toBeNull()
    expect(missingFields(result)).toContain('client')
    expect(followUpFor(result)).toBe('¿En qué hospital o clínica observaste el equipo?')
  })

  it('no pregunta cuando QVAC identifica todos los campos', () => {
    const result: Extraction = {
      client: 'Santa Elena', city: 'Ciudad de Panamá', country: 'Panamá',
      modality: 'Ultrasonido', quantity: 2, brand: 'Vitaria', model: 'Echo-8',
      ageYears: 4, confidence: 0.94,
    }
    expect(missingFields(result)).toEqual([])
    expect(followUpFor(result)).toBeNull()
  })
})
