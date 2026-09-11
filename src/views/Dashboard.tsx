import { AlertTriangle, Building2, Check, ChevronRight, MapPin, PackageCheck, Plus } from 'lucide-react'
import type { DashboardData } from '../lib/types'
import { ObservationTable } from '../components/ui'

export function Dashboard({ data, onCapture }: { data: DashboardData; onCapture: () => void }) {
  const max = Math.max(...data.byModality.map((item) => item.value), 1)
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Panorama operativo</p>
          <h1>Base instalada</h1>
          <p>Una vista confiable de lo observado en campo.</p>
        </div>
        <button className="primary" onClick={onCapture}>
          <Plus size={18} />
          Registrar visita
        </button>
      </header>

      <section className="metrics" aria-label="Indicadores principales">
        <article>
          <span className="metric-icon cyan"><PackageCheck size={20} /></span>
          <p>Equipos registrados</p>
          <strong>{data.totals.equipment}</strong>
          <small>unidades observadas</small>
        </article>
        <article>
          <span className="metric-icon blue"><Building2 size={20} /></span>
          <p>Clientes</p>
          <strong>{data.totals.clients}</strong>
          <small>centros identificados</small>
        </article>
        <article>
          <span className="metric-icon green"><Check size={20} /></span>
          <p>Confirmaciones</p>
          <strong>{data.totals.confirmed}</strong>
          <small>observaciones coincidentes</small>
        </article>
        <article>
          <span className="metric-icon amber"><AlertTriangle size={20} /></span>
          <p>Por revisar</p>
          <strong>{data.totals.conflicts}</strong>
          <small>conflictos visibles</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Distribución</p>
              <h2>Equipos por modalidad</h2>
            </div>
            <span>Unidades</span>
          </div>
          <div className="bars">
            {data.byModality.map((item) => (
              <div className="bar-row" key={item.label}>
                <span>{item.label}</span>
                <div><i style={{ width: `${(item.value / max) * 100}%` }} /></div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel country-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cobertura</p>
              <h2>Por país</h2>
            </div>
            <MapPin size={18} />
          </div>
          {data.byCountry.map((item, index) => (
            <div className="country" key={item.label}>
              <span className="rank">0{index + 1}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.value} equipos</small>
              </div>
              <ChevronRight size={17} />
            </div>
          ))}
          <p className="subheading">Por ciudad</p>
          {data.byCity.map((item, index) => (
            <div className="country" key={item.label}>
              <span className="rank">0{index + 1}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.value} equipos</small>
              </div>
              <ChevronRight size={17} />
            </div>
          ))}
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Actividad reciente</p>
            <h2>Últimas observaciones</h2>
          </div>
          <span>{data.observations.length} registros</span>
        </div>
        <ObservationTable observations={data.observations.slice(0, 5)} />
      </section>
    </>
  )
}
