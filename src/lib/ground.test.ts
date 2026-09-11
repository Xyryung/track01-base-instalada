import { describe, expect, it } from 'vitest'
import { groundExtraction } from './ground.js'
import type { Extraction } from './types.js'

const full: Extraction = {
  client: 'Hospital San Gabriel', city: 'Ciudad de Panamá', country: 'Panamá', modality: 'Tomografía',
  quantity: 2, brand: 'MedNova', model: 'CT-4', ageYears: 3, confidence: 0.9,
}

describe('guarda anti-invención', () => {
  it('conserva todo lo que el texto respalda y normaliza cliente y modalidad', () => {
    const text = 'Hospital San Gabriel en Ciudad de Panamá tiene 2 tomógrafos marca MedNova modelo CT-4 desde hace 3 años.'
    expect(groundExtraction(full, text)).toEqual({ ...full, client: 'San Gabriel' })
  })

  it('descarta un país inferido que el texto no menciona', () => {
    const text = 'Clínica Andes en Bogotá tiene 3 ultrasonidos marca Vitaria.'
    const result = groundExtraction({ ...full, client: 'Clínica Andes', city: 'Bogotá', country: 'Colombia', modality: 'Ultrasonido', quantity: 3, brand: 'Vitaria', model: null, ageYears: null }, text)
    expect(result.country).toBeNull()
    expect(result.city).toBe('Bogotá')
    expect(result.client).toBe('Andes')
  })

  it('descarta marca y modelo completados por el modelo', () => {
    const text = 'Vi un tomógrafo en el Hospital Central.'
    const result = groundExtraction({ ...full, client: 'Hospital Central', brand: 'Siemens', model: 'SOMATOM', city: null, country: null, ageYears: null, quantity: 1 }, text)
    expect(result.brand).toBeNull()
    expect(result.model).toBeNull()
    expect(result.client).toBe('Central')
  })

  it('acepta la modalidad aunque el texto use otra variante', () => {
    expect(groundExtraction(full, 'Hospital San Gabriel tiene 2 tomógrafos.').modality).toBe('Tomografía')
    expect(groundExtraction(full, 'Hospital San Gabriel tiene 2 resonancias.').modality).toBeNull()
  })

  it('solo conserva cantidad y antigüedad si el texto las sugiere', () => {
    expect(groundExtraction(full, 'Hospital San Gabriel tiene dos tomógrafos.').quantity).toBe(2)
    expect(groundExtraction(full, 'Hospital San Gabriel tiene tomógrafos.').quantity).toBeNull()
    expect(groundExtraction(full, 'Hospital San Gabriel tiene 2 tomógrafos desde hace 3 años.').ageYears).toBe(3)
    expect(groundExtraction(full, 'Hospital San Gabriel tiene 2 tomógrafos.').ageYears).toBeNull()
  })

  it('ignora acentos y mayúsculas al comprobar', () => {
    const result = groundExtraction({ ...full, city: 'Ciudad de Panama' }, 'HOSPITAL SAN GABRIEL en ciudad de panamá tiene 2 tomógrafos')
    expect(result.city).toBe('Ciudad de Panama')
    expect(result.client).toBe('San Gabriel')
  })
})
