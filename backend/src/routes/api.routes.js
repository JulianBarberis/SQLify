import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { consultaController } from '../controllers/consultaController.js'
import { pingDb } from '../controllers/pingDb.js'
import { validateConsulta } from '../middlewares/validateConsulta.js'

const apiRouter = Router()

const consultaRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 peticiones por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'demasiadas-peticiones',
    detail: 'Has superado el límite de consultas permitidas por minuto. Por favor, espera un momento antes de volver a intentar.'
  }
})

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servidor Express para generador IA de consultas SQL 🚀', status: 'healthy', version: 'v1' })
})

apiRouter.get('/db-ping', pingDb)
apiRouter.post('/generar-consulta', consultaRateLimiter, validateConsulta, consultaController)

export default apiRouter
