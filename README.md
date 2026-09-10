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
| Modelo | pendiente (CP0) |
| Tiempo de respuesta corta | pendiente (CP0) |
| Prueba sin conexión | pendiente: captura de modo avión en `/docs` |

## Ejecución

    npm install
    npm run prueba:qvac    # confirma que QVAC responde en local
    npm run dev            # API local en 8787 e interfaz en 5173

## Qué hace

1. **Capturar** — el colaborador escribe o dicta lo que vio, en lenguaje natural.
2. **Entender** — QVAC extrae cliente, ciudad, país, modalidad, cantidad, marca, modelo y antigüedad. Lo que no aparece queda vacío; el modelo tiene prohibido inventar.
3. **Preguntar** — el sistema hace una sola pregunta por el dato faltante más valioso.
4. **Validar** — dos autores que coinciden suben el equipo a Confirmado; las cantidades distintas quedan marcadas como conflicto, visibles, sin resolverse solas.
5. **Ver** — base instalada por cliente, con la trazabilidad de cada dato, y agregación por país y ciudad.

## Estado

- [ ] CP0 QVAC responde sin red
- [ ] CP1 Esqueleto y base de datos
- [ ] CP2 Extracción a JSON
- [ ] CP3 Guardado de punta a punta
- [ ] CP4 Pregunta de seguimiento
- [ ] CP5 Duplicados y estados
- [ ] CP6 Puntaje de confianza
- [ ] CP7 Cliente 360
- [ ] CP8 Dashboard
- [ ] CP9 Meta adicional
- [ ] CP10 Datos demo y congelado
- [ ] CP11 Video y repositorio

## Datos

Todos los datos son sintéticos. Clientes, marcas, modelos y ubicaciones son ficticios. No se usa información confidencial de clientes ni información competitiva real.

## Licencia

MIT
