import type { EquipmentStatus, Observation } from './types.js'
import { matchKey } from './normalize.js'

export interface GroupMember {
  id: number
  author: string
  quantity: number | null
}

/**
 * Estado de un grupo (cliente, modalidad) a partir de la ÚLTIMA observación de
 * cada autor: si un autor corrige su cantidad, cuenta la corrección.
 * - un solo autor → observado
 * - dos o más autores con la misma cantidad → confirmado
 * - cantidades distintas entre autores → conflicto (visible, no se resuelve solo)
 */
export function statusForGroup(members: GroupMember[]): EquipmentStatus {
  const latestByAuthor = new Map<string, GroupMember>()
  for (const member of members) {
    const previous = latestByAuthor.get(member.author)
    if (!previous || member.id > previous.id) latestByAuthor.set(member.author, member)
  }
  if (latestByAuthor.size < 2) return 'observado'
  const claims = [...latestByAuthor.values()].filter((member) => member.quantity !== null)
  const quantities = new Set(claims.map((member) => member.quantity))
  if (quantities.size > 1) return 'conflicto'
  return claims.length >= 2 ? 'confirmado' : 'observado'
}

export interface EquipmentGroup {
  key: string
  client: string | null
  modality: string | null
  city: string | null
  country: string | null
  brand: string | null
  model: string | null
  /** Cantidad consolidada: la más reciente. En conflicto NO se suman las versiones. */
  quantity: number | null
  status: EquipmentStatus
  /** Observaciones del grupo, la más reciente primero. */
  observations: Observation[]
  authors: string[]
}

function groupKey(item: Observation) {
  // Sin cliente o sin modalidad no hay con qué comparar: cada observación es su propio grupo.
  if (!item.client || !item.modality) return `id:${item.id}`
  return `${matchKey(item.client)}|${matchKey(item.modality)}`
}

/**
 * Agrupa las observaciones por (cliente, modalidad) y devuelve un equipo por grupo.
 * Dos autores que confirman el mismo equipo no lo duplican en el inventario.
 */
export function consolidateEquipment(observations: Observation[]): EquipmentGroup[] {
  const groups = new Map<string, Observation[]>()
  for (const item of [...observations].sort((a, b) => b.id - a.id)) {
    const key = groupKey(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.entries()].map(([key, items]) => {
    const first = <T>(pick: (item: Observation) => T | null) =>
      items.map(pick).find((value) => value !== null && value !== undefined) ?? null
    return {
      key,
      client: first((item) => item.client),
      modality: first((item) => item.modality),
      city: first((item) => item.city),
      country: first((item) => item.country),
      brand: first((item) => item.brand),
      model: first((item) => item.model),
      quantity: first((item) => item.quantity),
      status: statusForGroup(items),
      observations: items,
      authors: [...new Set(items.map((item) => item.author))],
    }
  })
}

/** Estado más exigente entre varios grupos: un conflicto pesa más que una confirmación. */
export function worstStatus(groups: { status: EquipmentStatus }[]): EquipmentStatus {
  if (groups.some((group) => group.status === 'conflicto')) return 'conflicto'
  if (groups.some((group) => group.status === 'confirmado')) return 'confirmado'
  return 'observado'
}
