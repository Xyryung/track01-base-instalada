import {
  completion,
  LLAMA_3_2_1B_INST_Q4_0,
  loadModel,
  unloadModel,
} from '@qvac/sdk'
import { z } from 'zod'
import type { Extraction } from '../lib/types.js'
import { extractLocally } from '../lib/extract.js'

const nullableNumber = (schema: z.ZodNumber) => z.preprocess(
  (value) => value == null || value === '' ? null : Number(value),
  schema.nullable(),
)
const nullableText = z.preprocess(
  (value) => typeof value === 'string' && ['null', 'n/a', 'desconocido'].includes(value.trim().toLowerCase()) ? null : value,
  z.string().nullable(),
).catch(null)

const ExtractionSchema = z.object({
  client: nullableText,
  city: nullableText,
  country: nullableText,
  modality: nullableText,
  quantity: nullableNumber(z.number().int().positive()).catch(null),
  brand: nullableText,
  model: nullableText,
  ageYears: nullableNumber(z.number().nonnegative()).catch(null),
  confidence: z.coerce.number().min(0).max(1).catch(0.5),
})

let modelPromise: Promise<string> | null = null

async function getModel() {
  modelPromise ??= loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0, modelType: 'llm' })
  return modelPromise
}

function cleanJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  const parsed = JSON.parse(candidate)
  return Array.isArray(parsed) ? parsed[0] : parsed
}

export async function extractWithQvac(text: string): Promise<Extraction> {
  const modelId = await getModel()
  const response = completion({
    modelId,
    stream: false,
    history: [
      {
        role: 'system',
        content: 'Extrae equipos médicos observados. Devuelve solo JSON con client, city, country, modality, quantity, brand, model, ageYears, confidence. Usa null cuando un dato no aparece. Nunca inventes. confidence debe estar entre 0 y 1.',
      },
      { role: 'user', content: text },
    ],
  })
  const extracted = ExtractionSchema.parse(cleanJson(await response.text))
  // Numeric claims are retained only when the source contains the necessary cue.
  // This guard makes the "never invent" rule deterministic even with a small model.
  if (!/\baños?\b/iu.test(text)) extracted.ageYears = null
  if (!/(?:\b\d+\b|\bun(?:a)?\b)\s+(?:equipos?|unidades?|tomógrafos?|resonancias?|ventiladores?|ecógrafos?|ultrasonidos?|mamógrafos?)/iu.test(text)) extracted.quantity = null
  const grounded = extractLocally(text)
  return {
    ...extracted,
    client: extracted.client ?? grounded.client,
    city: extracted.city ?? grounded.city,
    country: extracted.country ?? grounded.country,
    modality: extracted.modality ?? grounded.modality,
    quantity: extracted.quantity ?? grounded.quantity,
    brand: extracted.brand ?? grounded.brand,
    model: extracted.model ?? grounded.model,
    ageYears: extracted.ageYears ?? grounded.ageYears,
  }
}

export async function checkQvac() {
  const started = performance.now()
  const result = await extractWithQvac('Vi un tomógrafo marca MedNova modelo CT-4 en Hospital Central de Panamá.')
  return { result, elapsedMs: Math.round(performance.now() - started) }
}

export async function closeQvac() {
  if (!modelPromise) return
  await unloadModel({ modelId: await modelPromise, autoClose: true })
  modelPromise = null
}
