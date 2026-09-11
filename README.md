# Inteligencia de Base Instalada de Clientes

Track 01 · Decentralized AI Hackathon · 9–11 de septiembre, Ciudad de Panamá

Convierte lo que un colaborador de campo observa durante una visita a un hospital en datos estructurados y confiables sobre los equipos instalados. La captura es tan simple como una conversación y **toda la inferencia corre en el dispositivo con QVAC**.

## Por qué en el dispositivo

El colaborador está dentro de un hospital, con frecuencia sin conectividad estable, y lo que ve es información sensible del cliente. La captura y la extracción funcionan sin internet y sin enviar el contenido a ningún servicio externo.

`src/qvac/client.ts` es el único archivo del repositorio donde se ejecuta IA. Usa `loadModel` y `completion` de `@qvac/sdk`, con el modelo cargado en local.

No hay ninguna llamada a una API de IA en la nube. Se puede verificar así:

    grep -rn "openai\|anthropic\|https://" src/ servidor/ --include=*.ts

## Modelo y desempeño

| Dato | Valor |
|---|---|
| Modelo | Llama 3.2 1B Instruct Q4_0 vía QVAC |
| Tiempo de respuesta corta | 6–9.2 s con modelo en caché (equipo de desarrollo) |
| Primera carga | 81.5 s incluyendo descarga/carga inicial de 773 MB |
| Prueba sin conexión | QVAC validado desde caché local; evidencia visual pendiente en `/docs` |

## Ejecución

Requiere Node.js 20 o posterior.

    npm install
    npm run prueba:qvac    # confirma que QVAC responde en local
    npm run dev            # API local en 8787 e interfaz en 5173

La primera ejecución de QVAC descarga y guarda el modelo en el dispositivo. La interfaz incluye un modo de extracción local determinista para demos rápidas; activar **Usar QVAC** ejecuta el modelo local. Los registros se guardan en SQLite bajo `data/`.

## Qué hace

1. **Capturar** — el colaborador escribe o dicta lo que vio, en lenguaje natural.
2. **Entender** — QVAC extrae cliente, ciudad, país, modalidad, cantidad, marca, modelo y antigüedad. Lo que no aparece queda vacío; el modelo tiene prohibido inventar.
3. **Preguntar** — el sistema hace una sola pregunta por el dato faltante más valioso.
4. **Validar** — dos autores que coinciden suben el equipo a Confirmado; las cantidades distintas quedan marcadas como conflicto, visibles, sin resolverse solas.
5. **Ver** — base instalada por cliente, con la trazabilidad de cada dato, y agregación por país y ciudad.

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
- [x] CP9 Meta adicional: modo demo sin descarga previa
- [x] CP10 Datos demo sintéticos y congelado
- [ ] CP11 Video y repositorio

## Datos

Todos los datos son sintéticos. Clientes, marcas, modelos y ubicaciones son ficticios. No se usa información confidencial de clientes ni información competitiva real.

## Licencia

MIT
