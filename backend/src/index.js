import dotenv from 'dotenv'
import app from './app.js'
import { initPool, closePool } from './db/db.js'

dotenv.config()

initPool().catch(err => console.warn('Aviso: Base de datos no conectada al inicio:', err.message || err))
const PORT = process.env.PORT || 3001

/* Puerto utilizado por el servidor en consola */
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
})

const signals = ['SIGINT', 'SIGTERM']
signals.forEach(sig => {
  process.on(sig, async () => {
    console.log(`\nRecibí ${sig}, cerrando pool...`)
    await closePool()
    server.close(() => {
      process.exit(0)
    })
  })
})

export default server
