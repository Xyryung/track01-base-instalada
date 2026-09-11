import { Building2, FileText, Gauge, MapPin, PackageCheck, UsersRound } from 'lucide-react'
import type { Observation } from '../lib/types'
import { Confidence, Status } from '../components/ui'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function firstKnown(items: Observation[], key: 'city' | 'country' | 'brand' | 'model' | 'ageYears') {
  for (const item of items) {
    const value = item[key]
    if (value !== null && value !== undefined && value !== '') return value
  }
  return null
}

export function ClientDetail({ name, items, onBack }: { name: string; items: Observation[]; onBack: () => void }) {
  const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
  const authors = new Set(items.map((item) => item.author)).size
  const confidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length
  const latest = items[0]
  const location = [firstKnown(items, 'city'), firstKnown(items, 'country')].filter(Boolean).join(', ')

  const record: { label: string; value: string | null }[] = [
    { label: 'Ciudad', value: firstKnown(items, 'city') as string | null },
    { label: 'País', value: firstKnown(items, 'country') as string | null },
    { label: 'Marca', value: firstKnown(items, 'brand') as string | null },
    { label: 'Modelo', value: firstKnown(items, 'model') as string | null },
    {
      label: 'Antigüedad',
      value: firstKnown(items, 'ageYears') !== null ? `${firstKnown(items, 'ageYears')} años` : null,
    },
  ]

  return (
    <>
      <header className="page-header compact">
        <div>
          <button className="back" onClick={onBack}>← Volver a clientes</button>
          <p className="eyebrow">Cliente 360</p>
          <h1>{name}</h1>
          <p>
            <MapPin size={15} style={{ verticalAlign: '-2px', marginRight: 5 }} />
            {location || 'Ubicación pendiente'}
          </p>
        </div>
        <Status value={latest.status} />
      </header>

      <section className="metrics" aria-label="Indicadores del cliente">
        <article>
          <span className="metric-icon cyan"><PackageCheck size={20} /></span>
          <p>Equipos observados</p>
          <strong>{quantity}</strong>
          <small>unidades en total</small>
        </article>
        <article>
          <span className="metric-icon blue"><FileText size={20} /></span>
          <p>Fuentes</p>
          <strong>{items.length}</strong>
          <small>{items.length === 1 ? 'observación registrada' : 'observaciones registradas'}</small>
        </article>
        <article>
          <span className="metric-icon green"><UsersRound size={20} /></span>
          <p>Autores</p>
          <strong>{authors}</strong>
          <small>{authors === 1 ? 'colaborador en campo' : 'colaboradores en campo'}</small>
        </article>
        <article>
          <span className="metric-icon amber"><Gauge size={20} /></span>
          <p>Confianza media</p>
          <strong>{Math.round(confidence * 100)}%</strong>
          <small>sobre lo extraído</small>
        </article>
      </section>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Trazabilidad</p>
              <h2>Historial de observaciones</h2>
            </div>
            <span>{items.length} {items.length === 1 ? 'registro' : 'registros'}</span>
          </div>
          <div className="sources">
            {items.map((item) => (
              <article className="source" key={item.id}>
                <div className="source-head">
                  <span className="source-avatar">{initials(item.author)}</span>
                  <div>
                    <strong>{item.author}</strong>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>
                  <Status value={item.status} />
                </div>
                <blockquote className="source-quote">“{item.sourceText}”</blockquote>
                <div className="source-meta">
                  <span>
                    {item.modality ?? 'Modalidad pendiente'}
                    {item.quantity !== null ? ` · ${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'}` : ''}
                  </span>
                  <Confidence value={item.confidence} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Ficha</p>
                <h2>Datos consolidados</h2>
              </div>
              <Building2 size={18} />
            </div>
            <dl className="record">
              {record.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className={row.value ? '' : 'pending'}>{row.value ?? 'Pendiente'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Inventario</p>
                <h2>Equipos por fuente</h2>
              </div>
            </div>
            <div className="equipment-list">
              {items.map((item) => (
                <div className="equipment-row" key={item.id}>
                  <div>
                    <strong>{item.modality ?? 'Equipo pendiente'}</strong>
                    <small>{[item.brand, item.model].filter(Boolean).join(' · ') || 'Marca y modelo pendientes'}</small>
                  </div>
                  <b>{item.quantity ?? '—'}</b>
                </div>
              ))}
            </div>
          </section>

          {latest.followUp && (
            <div className="follow-up">
              <span>Pregunta sugerida</span>
              <strong>{latest.followUp}</strong>
              <small>Para completar la ficha en la próxima visita</small>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
