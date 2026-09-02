import { jest } from '@jest/globals'
import request from 'supertest'

const mockQuery = jest.fn()
const mockConsultarGemini = jest.fn()

jest.unstable_mockModule('../db/db.js', () => ({
  initPool: jest.fn().mockResolvedValue({}),
  closePool: jest.fn().mockResolvedValue({}),
  query: mockQuery
}))

jest.unstable_mockModule('../utils/gemini.js', () => ({
  consultarGemini: mockConsultarGemini
}))

const { default: app } = await import('../app.js')

describe('Express App & API Routes (src/app.js & src/routes/api.routes.js)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('GET / responde con mensaje de bienvenida en JSON', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      message: 'Servidor Express para generador IA de consultas SQL 🚀'
    })
  })

  it('GET /api responde con metadatos de salud y versión', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      message: 'Servidor Express para generador IA de consultas SQL 🚀',
      status: 'healthy',
      version: 'v1'
    })
  })

  it('GET /api/db-ping delega a pingDb y responde status 200', async () => {
    mockQuery.mockResolvedValueOnce([{ ok: 1 }])
    const res = await request(app).get('/api/db-ping')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ db: true })
  })

  it('POST /api/generar-consulta responde correctamente en flujo end-to-end simulado', async () => {
    mockConsultarGemini.mockResolvedValueOnce('SELECT * FROM Artista LIMIT 10')
    mockQuery.mockResolvedValueOnce([{ id: 1, nombre: 'Queen' }])

    const res = await request(app)
      .post('/api/generar-consulta')
      .send({ question: 'dame 10 artistas', run: true, limit: 10 })

    expect(res.status).toBe(200)
    expect(res.body.sql).toBe('SELECT * FROM Artista LIMIT 10')
    expect(res.body.executed.rowCount).toBe(1)
  })

  describe('CORS middleware', () => {
    it('permite peticiones sin cabecera origin (curl o server-to-server)', async () => {
      const res = await request(app).get('/')
      expect(res.status).toBe(200)
    })

    it('permite orígenes localhost y 127.0.0.1 con cualquier puerto', async () => {
      const res1 = await request(app).get('/').set('Origin', 'http://localhost:5173')
      expect(res1.status).toBe(200)
      expect(res1.headers['access-control-allow-origin']).toBe('http://localhost:5173')

      const res2 = await request(app).get('/').set('Origin', 'http://127.0.0.1:8080')
      expect(res2.status).toBe(200)
      expect(res2.headers['access-control-allow-origin']).toBe('http://127.0.0.1:8080')
    })

    it('permite subdominios de vercel.app', async () => {
      const res = await request(app).get('/').set('Origin', 'https://sqlify-client.vercel.app')
      expect(res.status).toBe(200)
      expect(res.headers['access-control-allow-origin']).toBe('https://sqlify-client.vercel.app')
    })

    it('permite FRONTEND_URL configurada en variables de entorno', async () => {
      process.env.FRONTEND_URL = 'https://mi-dominio-sqlify.com'
      const res = await request(app).get('/').set('Origin', 'https://mi-dominio-sqlify.com')
      expect(res.status).toBe(200)
      expect(res.headers['access-control-allow-origin']).toBe('https://mi-dominio-sqlify.com')
    })

    it('permite IPs de la lista permitida fija', async () => {
      const res = await request(app).get('/').set('Origin', 'http://158.69.212.87:5173')
      expect(res.status).toBe(200)
      expect(res.headers['access-control-allow-origin']).toBe('http://158.69.212.87:5173')
    })

    it('rechaza orígenes no permitidos con error de CORS', async () => {
      const res = await request(app).get('/').set('Origin', 'https://sitio-malicioso.com')
      expect(res.status).toBe(500)
      expect(res.body.detail).toBe('Origen https://sitio-malicioso.com no permitido por CORS')
    })

    it('rechaza subdominios de vercel no pertenecientes a SQLify', async () => {
      const res = await request(app).get('/').set('Origin', 'https://malicious-app.vercel.app')
      expect(res.status).toBe(500)
      expect(res.body.detail).toContain('no permitido por CORS')
    })

    it('elimina el header x-powered-by por seguridad con helmet', async () => {
      const res = await request(app).get('/')
      expect(res.headers['x-powered-by']).toBeUndefined()
    })

    it('maneja strings de origen inválidos sin arrojar excepción no controlada', async () => {
      const res = await request(app).get('/').set('Origin', 'not-a-valid-url')
      expect(res.status).toBe(500)
    })
  })

  describe('Rate Limiter', () => {
    it('bloquea peticiones al exceder 30 consultas por minuto en /api/generar-consulta', async () => {
      mockConsultarGemini.mockResolvedValue('SELECT 1')
      mockQuery.mockResolvedValue([])

      // Realizamos 30 peticiones permitidas
      for (let i = 0; i < 30; i++) {
        await request(app)
          .post('/api/generar-consulta')
          .send({ question: `consulta ${i}`, run: false })
      }

      // La petición 31 debe ser rechazada con 429
      const blockedRes = await request(app)
        .post('/api/generar-consulta')
        .send({ question: 'consulta 31', run: false })

      expect(blockedRes.status).toBe(429)
      expect(blockedRes.body.error).toBe('demasiadas-peticiones')
    })
  })
})
