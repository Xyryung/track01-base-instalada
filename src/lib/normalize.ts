// Normaliza lo que devuelve el modelo para que dos autores describan el mismo
// equipo con la misma etiqueta y la detección de duplicados pueda compararlos.

const MODALITIES: { label: string; pattern: RegExp }[] = [
  { label: 'Tomografía', pattern: /tomogra|\btac\b|\bct\b/ },
  { label: 'Resonancia magnética', pattern: /resonan|\bmri\b|\brmn?\b/ },
  { label: 'Ultrasonido', pattern: /ultraso|ecogra|\beco\b/ },
  { label: 'Rayos X', pattern: /rayos|radiogra|\brx\b/ },
  { label: 'Mamografía', pattern: /mamogra/ },
  { label: 'Ventilador', pattern: /ventilad/ },
  { label: 'Angiógrafo', pattern: /angiogra/ },
]

const INSTITUTION_PREFIX = /^(?:hospital|clinica|centro medico|centro de salud|policlinica|policlinico|instituto)\s+/i

export function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Clave de comparación: sin acentos, minúsculas, espacios colapsados. */
export function matchKey(value: string | null) {
  return value ? stripAccents(value).toLowerCase().replace(/\s+/g, ' ').trim() : ''
}

/** "tomografos", "Tomógrafo" o "CT" → "Tomografía". Lo desconocido se conserva tal cual. */
export function canonicalModality(value: string | null): string | null {
  if (!value) return null
  const key = matchKey(value)
  return MODALITIES.find((item) => item.pattern.test(key))?.label ?? value.trim()
}

/** ¿El texto menciona esta modalidad? Acepta variantes ("tomógrafos" menciona "Tomografía"). */
export function modalityMentioned(text: string, modality: string | null) {
  if (!modality) return false
  const haystack = matchKey(text)
  const entry = MODALITIES.find((item) => item.label === canonicalModality(modality))
  return entry ? entry.pattern.test(haystack) : haystack.includes(matchKey(modality))
}

/** "Hospital del Pacífico" → "Del Pacífico"; "Clínica Horizonte" → "Horizonte". */
export function canonicalClient(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const stripped = stripAccents(trimmed).replace(INSTITUTION_PREFIX, '')
  if (stripped === stripAccents(trimmed)) return trimmed
  const name = trimmed.slice(trimmed.length - stripped.length).trim()
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : trimmed
}
