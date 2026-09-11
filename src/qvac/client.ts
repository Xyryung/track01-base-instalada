import {
  completion,
  LLAMA_3_2_1B_INST_Q4_0,
  loadModel,
  unloadModel,
} from '@qvac/sdk'
import { z } from 'zod'
import type { Extraction } from '../lib/types.js'
import { groundExtraction } from '../lib/ground.js'

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
  // Si la carga falla, se olvida la promesa para que la siguiente llamada vuelva a intentar.
  modelPromise ??= loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0, modelType: 'llm' }).catch((error) => {
    modelPromise = null
    throw error
  })
  return modelPromise
}

function cleanJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  const parsed = JSON.parse(candidate)
  return Array.isArray(parsed) ? parsed[0] : parsed
}

const ATTEMPTS = 2

export async function extractWithQvac(text: string): Promise<Extraction> {
  // Un modelo de 1B a veces devuelve JSON malformado; se reintenta con el mismo
  // modelo local en lugar de degradar a otra vía: QVAC es la única extracción.
  let lastError: unknown
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return groundExtraction(await runModel(text), text)
    } catch (error) {
      lastError = error
      console.warn(`QVAC: intento ${attempt} de ${ATTEMPTS} falló:`, error instanceof Error ? error.message : error)
    }
  }
  throw lastError
}

async function runModel(text: string) {
  const modelId = await getModel()
  const response = completion({
    modelId,
    stream: false,
    history: [
      {
        role: 'system',
        content: `Extrae una observación de equipos médicos. Responde únicamente con un objeto JSON válido, sin markdown ni explicaciones, usando exactamente esta estructura:
{"client":string|null,"city":string|null,"country":string|null,"modality":string|null,"quantity":number|null,"brand":string|null,"model":string|null,"ageYears":number|null,"confidence":number}
Ejemplo: "Hospital Sol en David, Panamá tiene 2 ultrasonidos marca Acme modelo U1 desde hace 3 años" devuelve {"client":"Hospital Sol","city":"David","country":"Panamá","modality":"Ultrasonido","quantity":2,"brand":"Acme","model":"U1","ageYears":3,"confidence":0.95}.
Usa null cuando el texto no contenga el dato. Nunca inventes. confidence debe estar entre 0 y 1.`,
      },
      { role: 'user', content: text },
    ],
  })
  return ExtractionSchema.parse(cleanJson(await response.text))
}

export function warmUpQvac() {
  const started = performance.now()
  getModel()
    .then(() => console.log(`Modelo QVAC en memoria (${Math.round(performance.now() - started)} ms)`))
    .catch((error) => console.error('No se pudo precargar QVAC:', error))
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
