import { checkQvac, closeQvac } from '../src/qvac/client.js'

console.log('Cargando QVAC. La primera ejecución descarga el modelo al dispositivo…')
try {
  const { result, elapsedMs } = await checkQvac()
  console.log('QVAC respondió localmente en', `${elapsedMs} ms`)
  console.log(JSON.stringify(result, null, 2))
} finally {
  await closeQvac()
}
