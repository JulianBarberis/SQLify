import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { initPool, closePool } from './db/db.js'
import apiRouter from './routes/api.routes.js'
import { errorHandler } from './middlewares/errorHandler.js'

dotenv.config()
const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://158.69.212.87',
  'http://158.69.212.87:5173',
  'http://158.69.212.87:3000'
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    try {
      const parsedUrl = new URL(origin)
      if (parsedUrl.hostname.endsWith('.vercel.app')) {
        return callback(null, true)
      }
    } catch {
      // Ignorar URLs inválidas
    }
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origen ${origin} no permitido por CORS`), false)
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Middleware global de manejo de errores
app.use(errorHandler)
const signals = ['SIGINT', 'SIGTERM']
signals.forEach(sig => {
  process.on(sig, async () => {
    console.log(`\nRecibí ${sig}, cerrando pool...`)
    await closePool()
    process.exit(0)
  })
})

export default app