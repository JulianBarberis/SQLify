import { Router } from 'express'
import { consultaController } from '../controllers/consultaController.js'
import { pingDb } from '../controllers/pingDb.js'
import { validateConsulta } from '../middlewares/validateConsulta.js'

const apiRouter = Router()

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servidor Express para generador IA de consultas SQL 🚀', status: 'healthy', version: 'v1' })
})

apiRouter.get('/db-ping', pingDb)
apiRouter.post('/generar-consulta', validateConsulta, consultaController)

export default apiRouter
