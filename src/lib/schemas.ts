import { z } from 'zod'
import type { Extraction } from './types.js'

// Única fuente de verdad para validar la forma de `Extraction`.
// `satisfies` garantiza que el esquema no diverja de la interfaz.
export const ExtractionSchema = z.object({
  client: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  modality: z.string().nullable(),
  quantity: z.number().int().positive().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  ageYears: z.number().nonnegative().nullable(),
  confidence: z.number().min(0).max(1),
}) satisfies z.ZodType<Extraction>

export const CaptureSchema = z.object({
  author: z.string().trim().min(2).max(60),
  text: z.string().trim().min(8).max(2000),
  useQvac: z.boolean().default(false),
})

export const SaveSchema = CaptureSchema.extend({
  extraction: ExtractionSchema.optional(),
})
