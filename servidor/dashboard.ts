import type { DashboardData, Observation } from '../src/lib/types.js'

function aggregate(observations: Observation[], key: 'country' | 'city' | 'modality') {
  const totals = observations.reduce<Record<string, number>>((acc, item) => {
    const label = item[key] ?? 'Sin especificar'
    acc[label] = (acc[label] ?? 0) + (item.quantity ?? 0)
    return acc
  }, {})
  return Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function buildDashboard(observations: Observation[]): DashboardData {
  return {
    totals: {
      equipment: observations.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
      clients: new Set(observations.map((item) => item.client).filter(Boolean)).size,
      confirmed: observations.filter((item) => item.status === 'confirmado').length,
      conflicts: observations.filter((item) => item.status === 'conflicto').length,
    },
    observations,
    byCountry: aggregate(observations, 'country'),
    byCity: aggregate(observations, 'city'),
    byModality: aggregate(observations, 'modality'),
  }
}
