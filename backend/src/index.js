import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { initPool, closePool } from './db/db.js'
import apiRouter from './routes/api.routes.js'

dotenv.config()
const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',         // para desarrollo local
    'http://localhost:3000',
    'http://158.69.212.87',         // IP pública del VPS
    'http://158.69.212.87:5173',    // Front alojado en el VPS
    'http://158.69.212.87:3000'     
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 3600
}))

app.use(express.json())
initPool().catch(err => console.warn('Aviso: Base de datos no conectada al inicio:', err.message || err))
const PORT = process.env.PORT || 3001

/* Puerto utilizado por el servidor en consola */
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
})

// Rutas de la API bajo /api
app.use('/api', apiRouter)

// Ruta de prueba raíz y retrocompatibilidad
app.get('/', (req, res) => {
  res.send({ message: 'Servidor Express para generador IA de consultas SQL 🚀' })
})
const signals = ['SIGINT', 'SIGTERM']
signals.forEach(sig => {
  process.on(sig, async () => {
    console.log(`\nRecibí ${sig}, cerrando pool...`)
    await closePool()
    process.exit(0)
  })
})

export default app