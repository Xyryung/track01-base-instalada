import { createApp } from './app.js'
import { seedDemo } from './db.js'

const port = Number(process.env.PORT ?? 8787)

seedDemo()
createApp().listen(port, () => console.log(`API local lista en http://localhost:${port}`))
