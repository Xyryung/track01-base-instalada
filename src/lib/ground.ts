import type { Extraction } from './types.js'
import { canonicalClient, canonicalModality, matchKey, modalityMentioned } from './normalize.js'

// Guarda determinista de "nunca inventes": un dato devuelto por el modelo solo
// se conserva si el texto original lo respalda. Un modelo pequeño puede inferir
// (Bogotá → Colombia) o completar (marca típica de un modelo); aquí se descarta
// y el dato queda pendiente para la pregunta de seguimiento.

const NUMBER_WORDS = 'un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|quince|veinte'
const EQUIPMENT_WORDS = 'equipos?|unidades?|tomografos?|resonancias?|ventiladores?|ecografos?|ultrasonidos?|mamografos?|angiografos?|rayos|monitores?|incubadoras?'
const QUANTITY_CUE = new RegExp(`(?:\\b\\d+\\b|\\b(?:${NUMBER_WORDS})\\b)\\s+(?:${EQUIPMENT_WORDS})`, 'i')
const AGE_CUE = /\banos?\b/i

function mentioned(text: string, value: string | null) {
  return value !== null && value.trim() !== '' && matchKey(text).includes(matchKey(value))
}

export function groundExtraction(extracted: Extraction, text: string): Extraction {
  const plain = matchKey(text)
  const textual = (value: string | null) => (mentioned(text, value) ? value : null)
  return {
    ...extracted,
    client: canonicalClient(textual(extracted.client)),
    city: textual(extracted.city),
    country: textual(extracted.country),
    brand: textual(extracted.brand),
    model: textual(extracted.model),
    modality: modalityMentioned(text, extracted.modality) ? canonicalModality(extracted.modality) : null,
    quantity: QUANTITY_CUE.test(plain) ? extracted.quantity : null,
    ageYears: AGE_CUE.test(plain) ? extracted.ageYears : null,
  }
}
