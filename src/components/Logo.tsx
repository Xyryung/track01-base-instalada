// Marca ATLAS: curvas de nivel concéntricas con una línea de pulso en el
// centro — un mapa y un signo vital a la vez. Hereda el color del contenedor.
const BLOB = 'M32 6C46 4 58 14 58 28C58 42 50 58 34 58C18 58 6 48 6 34C6 20 18 8 32 6Z'

export function Logo({ size = 32, title = 'ATLAS' }: { size?: number; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      <path d={BLOB} />
      <path d={BLOB} transform="translate(32 32) scale(0.72) translate(-32 -32)" />
      <path d={BLOB} transform="translate(32 32) scale(0.46) translate(-32 -32)" strokeWidth={2.2} />
      <polyline points="21,32 26,32 29,27 32,38 35,25 37,32 43,32" strokeWidth={2.6} />
    </svg>
  )
}
