# Inteligencia de Base Instalada de Clientes

Track 01 · Decentralized AI Hackathon · 9–11 de septiembre, Ciudad de Panamá

Convierte lo que un colaborador de campo observa durante una visita a un hospital en datos estructurados y confiables sobre los equipos instalados. La captura es tan simple como una conversación y **toda la inferencia corre en el dispositivo con QVAC**.

## Por qué en el dispositivo

El colaborador está dentro de un hospital, con frecuencia sin conectividad estable, y lo que ve es información sensible del cliente. La captura y la extracción funcionan sin internet y sin enviar el contenido a ningún servicio externo.

`src/qvac/client.ts` es el único archivo del repositorio donde se ejecuta IA. Usa `loadModel` y `completion` de `@qvac/sdk`, con el modelo cargado en local.

No hay ninguna llamada a una API de IA en la nube. Se puede verificar así:

    grep -rn "openai\|anthropic\|https://" src/ servidor/ --include="*.ts"

## Modelo y desempeño

| Dato | Valor |
|---|---|
| Modelo | Llama 3.2 1B Instruct Q4_0 vía QVAC |
| Tiempo de respuesta corta | 12–25 s con modelo en caché (equipo de desarrollo, Apple Silicon) |
| Primera carga | 81.5 s incluyendo descarga/carga inicial de 773 MB; la API precarga el modelo al arrancar |
| Prueba sin conexión | QVAC validado desde caché local; evidencia visual pendiente en `/docs` |

## Ejecución

Requiere Node.js 20 o posterior.

    npm install
    npm run prueba:qvac    # confirma que QVAC responde en local
    npm run dev            # API local en 8787 e interfaz en 5173

La primera ejecución descarga y guarda el modelo en el dispositivo. A partir de ahí, **todas las extracciones usan QVAC local obligatoriamente**; no existe un modo alternativo ni llamadas a servicios de IA en la nube. Los registros se guardan en SQLite bajo `data/`.

## Qué hace

1. **Capturar** — el colaborador escribe lo que vio, en lenguaje natural (o lo dicta con el dictado del sistema operativo; el audio nunca pasa por la aplicación).
2. **Entender** — QVAC extrae cliente, ciudad, país, modalidad, cantidad, marca, modelo y antigüedad. Lo que no aparece queda vacío; el modelo tiene prohibido inventar. Las modalidades y los nombres de cliente se normalizan a un catálogo ("tomógrafos" → "Tomografía", "Hospital San Gabriel" → "San Gabriel") para que dos autores puedan compararse.
3. **Preguntar** — el sistema hace una sola pregunta por el dato faltante más valioso.
4. **Validar** — dos autores que coinciden suben el equipo a Confirmado; las cantidades distintas quedan marcadas como conflicto, visibles, sin resolverse solas. El estado se recalcula para todo el grupo (cliente, modalidad) con la última observación de cada autor, así que con tres o más autores todas las filas quedan coherentes y una corrección posterior del mismo autor cuenta.
5. **Ver** — base instalada por cliente, con la trazabilidad de cada dato, y agregación por país y ciudad. El inventario cuenta **cada equipo una sola vez** por (cliente, modalidad): dos autores que confirman no lo duplican, y en conflicto se muestra la cantidad más reciente sin sumar las versiones.

## Estado

- [x] CP0 Integración QVAC local y prueba reproducible
- [x] CP1 Esqueleto y base de datos SQLite
- [x] CP2 Extracción validada a JSON
- [x] CP3 Guardado de punta a punta
- [x] CP4 Pregunta de seguimiento priorizada
- [x] CP5 Duplicados y estados
- [x] CP6 Puntaje de confianza
- [x] CP7 Cliente 360
- [x] CP8 Dashboard
- [x] CP9 Meta adicional: validación determinista contra datos inventados
- [x] CP10 Datos demo sintéticos y congelado
- [ ] CP11 Video y repositorio

## Bases preexistentes

En cumplimiento del artículo 11.c de los Términos y Condiciones, se declaran todas las bases preexistentes de terceros usadas en este proyecto y su origen. Todas son librerías open source instaladas sin modificar desde npm (o servicios públicos, donde se indica); ninguna aporta lógica del producto.

| Componente | Origen | Licencia | Uso en el proyecto |
|---|---|---|---|
| Node.js 20 | [nodejs.org](https://nodejs.org) | MIT | Entorno de ejecución del servidor |
| React 19 y react-dom | Meta · [react.dev](https://react.dev) | MIT | Interfaz de usuario |
| Vite 7 y @vitejs/plugin-react | [vitejs.dev](https://vitejs.dev) | MIT | Servidor de desarrollo y empaquetado del frontend |
| TypeScript 5 | Microsoft · [typescriptlang.org](https://www.typescriptlang.org) | Apache-2.0 | Tipado estático |
| Express 5 | [expressjs.com](https://expressjs.com) | MIT | API HTTP local |
| cors | [github.com/expressjs/cors](https://github.com/expressjs/cors) | MIT | Cabeceras CORS entre interfaz y API |
| better-sqlite3 | [github.com/WiseLibs/better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | MIT | Persistencia SQLite en el dispositivo |
| Zod 4 | [zod.dev](https://zod.dev) | MIT | Validación de entradas y de la salida del modelo |
| lucide-react | [lucide.dev](https://lucide.dev) | ISC | Iconos de la interfaz |
| @qvac/sdk | Tether · [npmjs.com/package/@qvac/sdk](https://www.npmjs.com/package/@qvac/sdk) | Según su licencia | Inferencia local del modelo (única dependencia de IA) |
| Llama 3.2 1B Instruct (Q4_0) | Meta, distribuido por QVAC | Llama 3.2 Community License | Modelo de lenguaje que corre en el dispositivo |
| vitest, tsx, concurrently, @types/* | npm | MIT | Solo desarrollo: tests, ejecución de TypeScript, scripts |
| Fuentes Fraunces e Instrument Sans | Google Fonts (OFL) | SIL Open Font License | Tipografía de la interfaz. Es el único recurso externo; si no hay conexión se usan las fuentes del sistema y la app funciona igual |

Todo el código de lógica de negocio — extracción y validación de datos, normalización, detección de duplicados y estados, pregunta de seguimiento, agregación, base de datos, API e interfaz — es nuevo y fue escrito durante la ventana de 48 horas del hackathon. No se usaron plantillas ni proyectos previos. La identidad visual (logo y paleta) también se creó durante el evento.

## Datos

Todos los datos son sintéticos. Clientes, marcas, modelos y ubicaciones son ficticios. No se usa información confidencial de clientes ni información competitiva real.

## Licencia

MIT
