import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import apiRouter from './routes/api.routes.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()

// Cabeceras de seguridad HTTP básicas y eliminación de fingerprinting
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
app.disable('x-powered-by')

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://158.69.212.87',
  'http://158.69.212.87:5173',
  'http://158.69.212.87:3000'
]

// Patrón seguro para subdominios Vercel pertenecientes exclusivamente al proyecto SQLify
const sqlifyVercelPattern = /^https:\/\/(sqlify|sqlify-[a-z0-9-]+)\.vercel\.app$/

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    try {
      const parsedUrl = new URL(origin)
      if (sqlifyVercelPattern.test(parsedUrl.origin)) {
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

app.use(express.json({ limit: '10kb' }))

// Rutas de la API bajo /api
app.use('/api', apiRouter)

// Ruta de prueba raíz y retrocompatibilidad
app.get('/', (req, res) => {
  res.send({ message: 'Servidor Express para generador IA de consultas SQL 🚀' })
})

// Middleware global de manejo de errores
app.use(errorHandler)

export default app
