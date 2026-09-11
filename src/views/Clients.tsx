import { useMemo, useState } from 'react'
import { Building2, ChevronRight, MapPin, Search, UsersRound } from 'lucide-react'
import type { DashboardData, Observation } from '../lib/types'
import { consolidateEquipment, worstStatus, type EquipmentGroup } from '../lib/inventory'
import { matchKey } from '../lib/normalize'
import { Status } from '../components/ui'
import { ClientDetail } from './ClientDetail'

interface ClientSummary {
  name: string
  equipment: EquipmentGroup[]
  observations: Observation[]
}

// Agrupa el inventario consolidado por cliente con la misma clave normalizada
// que usa el servidor, así "San Gabriel" y "san gabriel" son el mismo cliente.
function groupByClient(observations: Observation[]): ClientSummary[] {
  const clients = new Map<string, ClientSummary>()
  for (const group of consolidateEquipment(observations)) {
    const name = group.client ?? 'Cliente sin identificar'
    const key = matchKey(name)
    const entry = clients.get(key) ?? { name, equipment: [], observations: [] }
    entry.equipment.push(group)
    entry.observations.push(...group.observations)
    clients.set(key, entry)
  }
  return [...clients.values()]
}

export function Clients({ data }: { data: DashboardData }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const clients = useMemo(() => groupByClient(data.observations), [data])
  const visible = clients.filter((client) => client.name.toLowerCase().includes(query.toLowerCase()))

  const current = selected ? clients.find((client) => client.name === selected) : null
  if (current) {
    return <ClientDetail name={current.name} items={current.observations} onBack={() => setSelected(null)} />
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
        {visible.map(({ name, equipment, observations }) => {
          const quantity = equipment.reduce((sum, group) => sum + (group.quantity ?? 0), 0)
          const authors = new Set(observations.map((item) => item.author)).size
          const location = [equipment[0]?.city, equipment[0]?.country].filter(Boolean).join(', ')
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
                <Status value={worstStatus(equipment)} />
              </div>
              <h2>{name}</h2>
              <p>
                <MapPin size={15} />
                {location || 'Ubicación pendiente'}
              </p>
              <div className="client-stat">
                <strong>{quantity}</strong>
                <span>equipos<br />consolidados</span>
              </div>
              <div className="client-equipment">
                {equipment.map((group) => (
                  <div key={group.key}>
                    <span>
                      {group.modality ?? 'Equipo pendiente'}
                      {group.status === 'conflicto' && <em className="tag-conflict"> en conflicto</em>}
                    </span>
                    <strong>{group.quantity ?? '—'}</strong>
                  </div>
                ))}
              </div>
              <footer>
                <span>
                  <UsersRound size={15} />
                  {authors} {authors === 1 ? 'autor' : 'autores'} · {observations.length} {observations.length === 1 ? 'fuente' : 'fuentes'}
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
