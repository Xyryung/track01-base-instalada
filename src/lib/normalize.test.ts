import { describe, expect, it } from 'vitest'
import { canonicalClient, canonicalModality, matchKey } from './normalize.js'

describe('normalización de salidas de QVAC', () => {
  it('lleva variantes de modalidad a una etiqueta de catálogo', () => {
    expect(canonicalModality('tomografos')).toBe('Tomografía')
    expect(canonicalModality('Tomógrafo')).toBe('Tomografía')
    expect(canonicalModality('equipos de ultrasonido')).toBe('Ultrasonido')
    expect(canonicalModality('rayos X')).toBe('Rayos X')
    expect(canonicalModality('resonancia')).toBe('Resonancia magnética')
    expect(canonicalModality('Dermatoscopio')).toBe('Dermatoscopio')
    expect(canonicalModality(null)).toBeNull()
  })

  it('quita el tipo de institución del nombre del cliente sin perder el resto', () => {
    expect(canonicalClient('Hospital San Gabriel')).toBe('San Gabriel')
    expect(canonicalClient('Hospital del Pacífico')).toBe('Del Pacífico')
    expect(canonicalClient('Clínica Horizonte')).toBe('Horizonte')
    expect(canonicalClient('Santa Elena')).toBe('Santa Elena')
    expect(canonicalClient('Hospital')).toBe('Hospital')
  })

  it('genera la misma clave para dos descripciones del mismo equipo', () => {
    expect(matchKey(canonicalClient('Hospital San Gabriel'))).toBe(matchKey('San Gabriel'))
    expect(matchKey(canonicalModality('tomografos'))).toBe(matchKey('Tomografía'))
  })
})
