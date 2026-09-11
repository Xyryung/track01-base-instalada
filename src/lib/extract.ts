import type { Extraction } from './types.js'

const COUNTRIES = ['Panamá', 'Colombia', 'Costa Rica', 'México', 'Guatemala', 'Ecuador', 'Perú']
const CITIES = ['Ciudad de Panamá', 'Panamá', 'Colón', 'David', 'Bogotá', 'Medellín', 'San José', 'Lima', 'Quito']
const MODALITIES: Record<string, string> = {
  'tomógraf': 'Tomografía', 'ct ': 'Tomografía', 'resonancia': 'Resonancia magnética',
  'rayos x': 'Rayos X', 'radiograf': 'Rayos X', 'ultrason': 'Ultrasonido',
  'ecógraf': 'Ultrasonido', 'mamógraf': 'Mamografía', 'ventilador': 'Ventilación',
}

function title(value: string) {
  return value.trim().replace(/\b\p{L}/gu, (char) => char.toUpperCase())
}

export function extractLocally(text: string): Extraction {
  const normalized = text.toLocaleLowerCase('es')
  const clientMatch = text.match(/(?:hospital|clínica|clinica|centro médico|centro medico)\s+([\p{L}\d][\p{L}\d\s-]{1,45}?)(?=\s+(?:de|en|tiene|cuenta|con)\b|[,.;]|$)/iu)
  const quantityMatch = text.match(/\b(\d+|un(?:a)?)\s+(?:equipos?|unidades?|tomógrafos?|resonancias?|ventiladores?|ecógrafos?|ultrasonidos?|mamógrafos?)/iu)
  const brandMatch = text.match(/(?:marca|fabricante)\s+([\p{L}\d-]+)/iu)
  const modelMatch = text.match(/modelo\s+([\p{L}\d-]+)/iu)
  const ageMatch = text.match(/(?:hace|desde hace|antigüedad de|antiguedad de)\s+(\d+(?:[.,]\d+)?)\s+años?/iu)
  const country = COUNTRIES.find((item) => normalized.includes(item.toLocaleLowerCase('es'))) ?? null
  const city = CITIES.find((item) => normalized.includes(item.toLocaleLowerCase('es'))) ?? null
  const modality = Object.entries(MODALITIES).find(([key]) => normalized.includes(key))?.[1] ?? null
  const values = [clientMatch, quantityMatch, brandMatch, modelMatch, ageMatch, country, city, modality]
  const present = values.filter(Boolean).length
  return {
    client: clientMatch ? title(clientMatch[1]) : null,
    city,
    country,
    modality,
    quantity: quantityMatch ? (/^un/iu.test(quantityMatch[1]) ? 1 : Number(quantityMatch[1])) : null,
    brand: brandMatch?.[1] ?? null,
    model: modelMatch?.[1] ?? null,
    ageYears: ageMatch ? Number(ageMatch[1].replace(',', '.')) : null,
    confidence: Math.min(0.96, 0.42 + present * 0.065),
  }
}

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
