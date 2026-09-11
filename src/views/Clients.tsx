import { useMemo, useState } from 'react'
import { Building2, ChevronRight, MapPin, Search, UsersRound } from 'lucide-react'
import type { DashboardData, Observation } from '../lib/types'
import { Status } from '../components/ui'
import { ClientDetail } from './ClientDetail'

function groupByClient(observations: Observation[], query: string) {
  const groups = new Map<string, Observation[]>()
  for (const item of observations) {
    const key = item.client ?? 'Cliente sin identificar'
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.entries()].filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
}

export function Clients({ data }: { data: DashboardData }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const clients = useMemo(() => groupByClient(data.observations, query), [data, query])

  const selectedItems = selected
    ? data.observations.filter((item) => (item.client ?? 'Cliente sin identificar') === selected)
    : []
  if (selected && selectedItems.length > 0) {
    return <ClientDetail name={selected} items={selectedItems} onBack={() => setSelected(null)} />
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Cliente 360</p>
          <h1>Clientes y equipos</h1>
          <p>Trazabilidad completa de cada dato observado.</p>
        </div>
        <label className="search">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente" />
        </label>
      </header>

      <div className="client-grid">
        {clients.map(([name, items]) => {
          const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
          const authors = new Set(items.map((item) => item.author)).size
          const latest = items[0]
          return (
            <article
              className="panel client-card"
              key={name}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalle de ${name}`}
              onClick={() => setSelected(name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(name)
                }
              }}
            >
              <div className="client-top">
                <span className="client-icon"><Building2 size={22} /></span>
                <Status value={latest.status} />
              </div>
              <h2>{name}</h2>
              <p>
                <MapPin size={15} />
                {[latest.city, latest.country].filter(Boolean).join(', ') || 'Ubicación pendiente'}
              </p>
              <div className="client-stat">
                <strong>{quantity}</strong>
                <span>equipos<br />observados</span>
              </div>
              <div className="client-equipment">
                {items.map((item) => (
                  <div key={item.id}>
                    <span>{item.modality ?? 'Equipo pendiente'}</span>
                    <strong>{item.quantity ?? '—'}</strong>
                  </div>
                ))}
              </div>
              <footer>
                <span>
                  <UsersRound size={15} />
                  {authors} {authors === 1 ? 'autor' : 'autores'}
                </span>
                <span className="client-open">
                  Ver detalle
                  <ChevronRight size={14} />
                </span>
              </footer>
            </article>
          )
        })}
      </div>
    </>
  )
}
