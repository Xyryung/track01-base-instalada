export type EquipmentStatus = 'observado' | 'confirmado' | 'conflicto'

export interface Extraction {
  client: string | null
  city: string | null
  country: string | null
  modality: string | null
  quantity: number | null
  brand: string | null
  model: string | null
  ageYears: number | null
  confidence: number
}

export interface Observation extends Extraction {
  id: number
  author: string
  sourceText: string
  status: EquipmentStatus
  createdAt: string
  missing: string[]
  followUp: string | null
}

export interface DashboardData {
  totals: { equipment: number; clients: number; confirmed: number; conflicts: number }
  observations: Observation[]
  byCountry: { label: string; value: number }[]
  byCity: { label: string; value: number }[]
  byModality: { label: string; value: number }[]
}

export const EMPTY_EXTRACTION: Extraction = {
  client: null, city: null, country: null, modality: null, quantity: null,
  brand: null, model: null, ageYears: null, confidence: 0
}
