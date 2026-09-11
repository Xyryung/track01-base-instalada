import { describe, expect, it } from 'vitest'
import { extractLocally, followUpFor, missingFields } from './extract.js'

describe('extracción local', () => {
  it('convierte una nota de campo en datos estructurados sin inventar', () => {
    const result = extractLocally('Hospital Santa Elena en Ciudad de Panamá tiene 2 equipos de ultrasonido marca Vitaria modelo Echo-8 desde hace 4 años.')
    expect(result).toMatchObject({
      client: 'Santa Elena', city: 'Ciudad de Panamá', country: 'Panamá',
      modality: 'Ultrasonido', quantity: 2, brand: 'Vitaria', model: 'Echo-8', ageYears: 4,
    })
    expect(result.confidence).toBeGreaterThan(.8)
  })

  it('mantiene vacíos los datos ausentes y prioriza una sola pregunta', () => {
    const result = extractLocally('Vi un tomógrafo durante la visita.')
    expect(result.quantity).toBe(1)
    expect(result.client).toBeNull()
    expect(missingFields(result)).toContain('client')
    expect(followUpFor(result)).toBe('¿En qué hospital o clínica observaste el equipo?')
  })
})
