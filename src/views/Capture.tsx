import { useState } from 'react'
import { AlertTriangle, ArrowRight, Check, CircleGauge, Mic, ServerOff, Sparkles } from 'lucide-react'
import type { Extraction } from '../lib/types'
import { EMPTY_EXTRACTION } from '../lib/types'
import { FIELD_LABELS, followUpFor, missingFields } from '../lib/extract'
import { api } from '../lib/api'
import { Confidence } from '../components/ui'

const sample =
  'Hospital Santa Elena en Ciudad de Panamá tiene 2 equipos de ultrasonido marca Vitaria modelo Echo-8 desde hace 4 años.'

export function Capture({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [author, setAuthor] = useState('Ana M.')
  const [text, setText] = useState('')
  const [result, setResult] = useState<Extraction | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function extract() {
    setBusy(true)
    setError('')
    try {
      const body = await api<{ extraction: Extraction }>('/api/extract', {
        method: 'POST',
        body: JSON.stringify({ author, text }),
      })
      setResult(body.extraction)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      await api('/api/observations', {
        method: 'POST',
        body: JSON.stringify({ author, text, extraction: result }),
      })
      onSaved()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  function updateField(key: keyof typeof FIELD_LABELS, raw: string) {
    if (!result) return
    const isNumeric = key === 'quantity' || key === 'ageYears'
    setResult({ ...result, [key]: isNumeric ? (raw ? Number(raw) : null) : raw || null })
  }

  const fields = result ?? EMPTY_EXTRACTION
  const missing = result ? missingFields(result) : []

  return (
    <>
      <header className="page-header compact">
        <div>
          <button className="back" onClick={onCancel}>← Volver</button>
          <p className="eyebrow">Nueva observación</p>
          <h1>¿Qué viste durante la visita?</h1>
          <p>Descríbelo con tus propias palabras. Lo que no se mencione quedará pendiente.</p>
        </div>
      </header>

      <div className="capture-grid">
        <section className="panel capture-panel">
          <div className="field-row">
            <label>
              Autor de la visita
              <input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </label>
            <div className="qvac-active" aria-label="QVAC local siempre activo">
              <Sparkles size={17} />
              <span><strong>QVAC local</strong><small>Siempre activo</small></span>
              <i />
            </div>
          </div>

          <label className="narrative">
            Notas de campo
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(null) }}
              placeholder="Ej. Vi dos tomógrafos…"
              rows={8}
            />
          </label>
          <p className="hint">
            <Mic size={14} />
            Puedes dictar con el dictado del sistema (en macOS, pulsa dos veces la tecla 🎤/fn). El audio no
            pasa por esta aplicación.
          </p>

          <div className="sample">
            <span>Prueba con un ejemplo</span>
            <button onClick={() => { setText(sample); setResult(null) }}>{sample}</button>
          </div>

          {error && (
            <div className="error">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <button
            className="primary wide"
            disabled={busy || text.trim().length < 8 || author.trim().length < 2}
            onClick={extract}
          >
            {busy ? 'Procesando en el dispositivo…' : <>Extraer datos <ArrowRight size={18} /></>}
          </button>
          <p className="privacy">
            <ServerOff size={15} />
            QVAC procesa el contenido en este dispositivo y no lo envía a la nube.
          </p>
        </section>

        <section className={`panel extraction-panel ${result ? 'has-result' : ''}`}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Extracción estructurada</p>
              <h2>Datos identificados</h2>
            </div>
            {result && <Confidence value={result.confidence} />}
          </div>

          {!result ? (
            <div className="empty">
              <CircleGauge size={32} />
              <strong>Esperando una descripción</strong>
              <p>Los campos identificados aparecerán aquí para que puedas revisarlos.</p>
            </div>
          ) : (
            <>
              <div className="field-grid">
                {(Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]).map((key) => (
                  <label key={key}>
                    <span>{FIELD_LABELS[key]}</span>
                    <input
                      value={fields[key] ?? ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder="No identificado"
                    />
                  </label>
                ))}
              </div>
              {missing.length > 0 && (
                <div className="follow-up">
                  <span>Pregunta sugerida</span>
                  <strong>{followUpFor(result)}</strong>
                  <small>
                    {missing.length} {missing.length === 1 ? 'dato pendiente' : 'datos pendientes'} · Solo
                    preguntamos por el más valioso
                  </small>
                </div>
              )}
              <button className="primary wide" onClick={save} disabled={busy}>
                <Check size={18} />
                Confirmar y guardar
              </button>
            </>
          )}
        </section>
      </div>
    </>
  )
}
