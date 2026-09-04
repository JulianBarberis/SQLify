import dotenv from 'dotenv'
import app from './app.js'
import { initPool, closePool } from './db/db.js'
import { seedDatabase } from './db/scripts/seed.js'

dotenv.config()

initPool()
  .then(async (pool) => {
    try {
      const conn = await pool.getConnection()
      try {
        await seedDatabase(conn)
      } finally {
        conn.release()
      }
    } catch (seedErr) {
      console.warn('Aviso: Auto-seeding no completado al inicio:', seedErr.message || seedErr)
    }
  })
  .catch(err => console.warn('Aviso: Base de datos no conectada al inicio:', err.message || err))
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
