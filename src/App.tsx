import { useEffect, useState } from 'react'
import { Activity, Building2, Database, LayoutDashboard, Plus, X } from 'lucide-react'
import type { DashboardData } from './lib/types'
import { api } from './lib/api'
import { Dashboard } from './views/Dashboard'
import { Capture } from './views/Capture'
import { Clients } from './views/Clients'

type View = 'dashboard' | 'capture' | 'clients'

const NAV_ITEMS = [
  { view: 'dashboard', label: 'Panorama', Icon: LayoutDashboard },
  { view: 'capture', label: 'Capturar visita', Icon: Plus },
  { view: 'clients', label: 'Clientes 360', Icon: Building2 },
] as const

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      setData(await api<DashboardData>('/api/dashboard'))
      setError('')
    } catch {
      setError('No se pudo conectar con la API local.')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <span><Activity size={23} /></span>
          <div>
            <strong>ATLAS</strong>
            <small>Inteligencia instalada</small>
          </div>
        </div>

        <nav aria-label="Navegación principal">
          {NAV_ITEMS.map(({ view: target, label, Icon }) => (
            <button key={target} className={view === target ? 'active' : ''} onClick={() => setView(target)}>
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="device">
          <span><Database size={18} /><i /></span>
          <strong>Datos en el dispositivo</strong>
          <small>Sincronización no requerida</small>
        </div>
        <div className="user">
          <span>AM</span>
          <div>
            <strong>Ana Méndez</strong>
            <small>Colaborador de campo</small>
          </div>
        </div>
      </aside>

      <main>
        {error ? (
          <div className="fatal">
            <X size={24} />
            <h1>API local no disponible</h1>
            <p>{error}</p>
            <button onClick={load}>Reintentar</button>
          </div>
        ) : !data ? (
          <div className="loader">
            <i />
            <span>Cargando base instalada…</span>
          </div>
        ) : view === 'capture' ? (
          <Capture onCancel={() => setView('dashboard')} onSaved={async () => { await load(); setView('dashboard') }} />
        ) : view === 'clients' ? (
          <Clients data={data} />
        ) : (
          <Dashboard data={data} onCapture={() => setView('capture')} />
        )}
      </main>
    </div>
  )
}
