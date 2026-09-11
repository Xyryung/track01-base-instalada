import { warmUpQvac } from '../src/qvac/client.js'
import { createApp } from './app.js'
import { seedDemo } from './db.js'

const port = Number(process.env.PORT ?? 8787)

seedDemo()
createApp().listen(port, () => {
  console.log(`API local lista en http://localhost:${port}`)
  // El primer uso del modelo puede tardar decenas de segundos; se precarga
  // al arrancar para que la primera extracción real no espere ni falle.
  warmUpQvac()
})
