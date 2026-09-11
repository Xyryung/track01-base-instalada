import type { DashboardData, Observation } from '../src/lib/types.js'
import { consolidateEquipment, type EquipmentGroup } from '../src/lib/inventory.js'
import { matchKey } from '../src/lib/normalize.js'

// Las agregaciones se hacen sobre el inventario consolidado (un equipo por
// cliente y modalidad), nunca sobre observaciones sueltas: dos autores que
// confirman el mismo equipo no lo cuentan dos veces.
function aggregate(groups: EquipmentGroup[], key: 'country' | 'city' | 'modality') {
  const totals = groups.reduce<Record<string, number>>((acc, group) => {
    const label = group[key] ?? 'Sin especificar'
    acc[label] = (acc[label] ?? 0) + (group.quantity ?? 0)
    return acc
  }, {})
  return Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function buildDashboard(observations: Observation[]): DashboardData {
  const groups = consolidateEquipment(observations)
  return {
    totals: {
      equipment: groups.reduce((sum, group) => sum + (group.quantity ?? 0), 0),
      clients: new Set(groups.map((group) => matchKey(group.client)).filter(Boolean)).size,
      confirmed: groups.filter((group) => group.status === 'confirmado').length,
      conflicts: groups.filter((group) => group.status === 'conflicto').length,
    },
    observations,
    byCountry: aggregate(groups, 'country'),
    byCity: aggregate(groups, 'city'),
    byModality: aggregate(groups, 'modality'),
  }
}
