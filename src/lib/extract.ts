import type { Extraction } from './types.js'

export const FIELD_LABELS: Record<keyof Omit<Extraction, 'confidence'>, string> = {
  client: 'cliente', city: 'ciudad', country: 'país', modality: 'modalidad',
  quantity: 'cantidad', brand: 'marca', model: 'modelo', ageYears: 'antigüedad',
}

export function missingFields(data: Extraction) {
  return (Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]).filter((key) => data[key] == null)
}

export function followUpFor(data: Extraction): string | null {
  const questions: Partial<Record<keyof typeof FIELD_LABELS, string>> = {
    client: '¿En qué hospital o clínica observaste el equipo?',
    modality: '¿Qué tipo de equipo era?',
    quantity: '¿Cuántas unidades viste?',
    city: '¿En qué ciudad está el cliente?',
    country: '¿En qué país está el cliente?',
    brand: '¿Pudiste identificar la marca?',
    model: '¿Cuál era el modelo?',
    ageYears: '¿Qué antigüedad aproximada tiene?',
  }
  const priority: (keyof typeof FIELD_LABELS)[] = ['client', 'modality', 'quantity', 'city', 'country', 'brand', 'model', 'ageYears']
  const missing = priority.find((key) => data[key] == null)
  return missing ? questions[missing] ?? null : null
}
