import cors from 'cors'
import express from 'express'
import { extractLocally } from '../src/lib/extract.js'
import { CaptureSchema, SaveSchema } from '../src/lib/schemas.js'
import { extractWithQvac } from '../src/qvac/client.js'
import { buildDashboard } from './dashboard.js'
import { listObservations, saveObservation } from './db.js'

async function runExtraction(text: string, useQvac: boolean) {
  return useQvac ? await extractWithQvac(text) : extractLocally(text)
}

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '64kb' }))

  app.get('/api/health', (_request, response) => response.json({ ok: true, inference: 'on-device' }))

  app.get('/api/dashboard', (_request, response) => response.json(buildDashboard(listObservations())))

  app.post('/api/extract', async (request, response) => {
    const parsed = CaptureSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Revisa el autor y la descripción.' })
    try {
      response.json({ extraction: await runExtraction(parsed.data.text, parsed.data.useQvac) })
    } catch (error) {
      console.error(error)
      response.status(503).json({ error: 'QVAC no está disponible todavía. Desactiva QVAC para usar la extracción local.' })
    }
  })

  app.post('/api/observations', async (request, response) => {
    const parsed = SaveSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Revisa el autor y la descripción.' })
    try {
      const extraction = parsed.data.extraction ?? (await runExtraction(parsed.data.text, parsed.data.useQvac))
      response.status(201).json(saveObservation(parsed.data.author, parsed.data.text, extraction))
    } catch (error) {
      console.error(error)
      response.status(503).json({ error: 'No se pudo procesar la visita en este dispositivo.' })
    }
  })

  return app
}
