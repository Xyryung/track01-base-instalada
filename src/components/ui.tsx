import type { EquipmentStatus, Observation } from '../lib/types'

const statusLabels: Record<EquipmentStatus, string> = {
  confirmado: 'Confirmado',
  conflicto: 'Conflicto',
  observado: 'Observado',
}

export function Status({ value }: { value: EquipmentStatus }) {
  return (
    <span className={`status status-${value}`}>
      <i />
      {statusLabels[value]}
    </span>
  )
}

export function Confidence({ value }: { value: number }) {
  const percent = Math.round(value * 100)
  return (
    <div className="confidence">
      <div className="confidence-track">
        <span style={{ width: `${percent}%` }} />
      </div>
      <strong>{percent}%</strong>
    </div>
  )
}

export function ObservationTable({ observations }: { observations: Observation[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cliente / ubicación</th>
            <th>Equipo</th>
            <th>Cantidad</th>
            <th>Confianza</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {observations.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.client ?? 'Cliente sin identificar'}</strong>
                <small>{[item.city, item.country].filter(Boolean).join(', ') || 'Ubicación pendiente'}</small>
              </td>
              <td>
                <strong>{item.modality ?? 'Modalidad pendiente'}</strong>
                <small>{[item.brand, item.model].filter(Boolean).join(' · ') || 'Marca y modelo pendientes'}</small>
              </td>
              <td><b>{item.quantity ?? '—'}</b></td>
              <td><Confidence value={item.confidence} /></td>
              <td><Status value={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
