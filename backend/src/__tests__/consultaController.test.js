import { jest } from '@jest/globals'

/* Solamente se testea el controller
porque es el unico flujo real de la aplicación,
no hay lógica de dominio y el resto de archivos
son scripts que se corrieron unicamente
para cargar datos o autenticarse en los servicios externos
de Gemini y Spotify, no cambian durante la ejecución normal del sistema */

/* Mock de dependencias
previo al import por temas
de compatibilidad entre ESModules y Jest */
jest.unstable_mockModule('../db/db.js', () => ({
  query: jest.fn()
}))
jest.unstable_mockModule('../utils/validarConsulta.js', () => ({
  validarCampos: jest.fn()
}))
jest.unstable_mockModule('../utils/gemini.js', () => ({
  consultarGemini: jest.fn()
}))
jest.unstable_mockModule('../utils/normalizarSql.js', () => ({
  normalizeGeneratedSql: jest.fn()
}))

/* Import de funciones mockeadas y el controller */
const { query } = await import('../db/db.js')
const { validarCampos } = await import('../utils/validarConsulta.js')
const { consultarGemini } = await import('../utils/gemini.js')
const { normalizeGeneratedSql } = await import('../utils/normalizarSql.js')
const { consultaController } = await import('../controllers/consultaController.js')

describe('consultaController', () => {
  /* Mockeo request y response */
  const mockReq = (body = {}) => ({ body })
  const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devuelve SQL generado sin ejecutar (run=false)', async () => {
    const req = mockReq({ question: 'Traeme todos los usuarios', run: false })
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('```sql SELECT * FROM usuarios;```')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT * FROM usuarios;')

    await consultaController(req, res)

    expect(res.json).toHaveBeenCalledWith({
      sql: 'SELECT * FROM usuarios;',
      explain: 'Consulta SQL generada por GeminiAPI.'
    })
  })

  it('ejecuta la consulta cuando run=true', async () => {
    const req = mockReq({ question: 'Traeme todos los usuarios', run: true })
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('```sql SELECT * FROM usuarios;```')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT * FROM usuarios;')
    query.mockResolvedValueOnce([{ id: 1, nombre: 'Thomas' }])

    await consultaController(req, res)

    expect(res.json).toHaveBeenCalledWith({
      sql: 'SELECT * FROM usuarios;',
      explain: 'Consulta SQL generada por GeminiAPI.',
      executed: { rowCount: 1, rows: [{ id: 1, nombre: 'Thomas' }] }
    })
  })

  it('devuelve 400 si la SQL es inválida', async () => {
    const req = mockReq({ question: 'Quien es mejor Cristiano Ronaldo o Messi?', run: false })
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('```sql La pregunta no tiene relación con la base de datos;```')
    normalizeGeneratedSql.mockReturnValueOnce(null)

    await consultaController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Hubo un error en la consulta',
      sql: '```sql La pregunta no tiene relación con la base de datos;```',
      detail:
        'La consulta SQL generada por Gemini es inválida o no cumple con las políticas de seguridad. Por favor inténtelo de nuevo reformulando su consulta.'
    })
  })

  it('devuelve 403 si el usuario no tiene permisos (ER_ACCESS_DENIED_ERROR)', async () => {
    const req = { body: { question: 'Dropeame todas las tablas', run: true } }
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('```sql DELETE FROM usuarios;```')
    normalizeGeneratedSql.mockReturnValueOnce('DELETE FROM usuarios;')

    /* Simulo error de la base de datos */
    const error = new Error('Access denied')
    error.code = 'ER_ACCESS_DENIED_ERROR'
    query.mockRejectedValueOnce(error)

    await consultaController(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'permiso-denegado',
      detail: expect.stringContaining('no tiene permisos'),
      sql: 'DELETE FROM usuarios;'
    })
  })

  it('devuelve 400 si hay error de sintaxis SQL (ER_PARSE_ERROR)', async () => {
    const req = { body: { question: 'consulta inválida', run: true } }
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('```sql SELECT FROM;```')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT FROM;')

    const error = new Error('Syntax error')
    error.code = 'ER_PARSE_ERROR'
    query.mockRejectedValueOnce(error)

    await consultaController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'consulta-sql-invalida',
      detail: expect.stringContaining('sintaxis'),
      sql: 'SELECT FROM;'
    })
  })

  it('devuelve 500 si ocurre un error desconocido', async () => {
    const req = { body: { question: 'consulta', run: true } }
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('```sql SELECT * FROM usuarios;```')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT * FROM usuarios;')

    const error = new Error('Conexión perdida')
    query.mockRejectedValueOnce(error)

    await consultaController(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'generar-consulta-failed',
      detail: expect.stringContaining('Conexión perdida'),
      sql: 'SELECT * FROM usuarios;'
    })
  })
})
