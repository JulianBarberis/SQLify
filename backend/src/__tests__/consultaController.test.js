import { jest } from '@jest/globals'

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

const { query } = await import('../db/db.js')
const { validarCampos } = await import('../utils/validarConsulta.js')
const { consultarGemini } = await import('../utils/gemini.js')
const { normalizeGeneratedSql } = await import('../utils/normalizarSql.js')
const { consultaController } = await import('../controllers/consultaController.js')

describe('consultaController', () => {
  const mockReq = (body = {}) => ({ body })
  const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('maneja req.body indefinido o vacío usando valores por defecto', async () => {
    const req = {}
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('SELECT * FROM Artista;')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT * FROM Artista;')

    await consultaController(req, res)

    expect(res.json).toHaveBeenCalledWith({
      sql: 'SELECT * FROM Artista;',
      explain: 'Consulta SQL generada por GeminiAPI.'
    })
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
    consultarGemini.mockResolvedValueOnce('DELETE FROM usuarios;')
    normalizeGeneratedSql.mockReturnValueOnce('DELETE FROM usuarios;')

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

  it('devuelve 403 si el mensaje de error de MySQL contiene command denied', async () => {
    const req = { body: { question: 'Drop table', run: true } }
    const res = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('DROP TABLE test;')
    normalizeGeneratedSql.mockReturnValueOnce('DROP TABLE test;')

    const error = { sqlMessage: 'command denied to user' }
    query.mockRejectedValueOnce(error)

    await consultaController(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'permiso-denegado' })
    )
  })

  it('devuelve 400 si hay error de sintaxis SQL (ER_PARSE_ERROR o ER_SYNTAX_ERROR)', async () => {
    const req = { body: { question: 'consulta inválida', run: true } }
    const res1 = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('SELECT FROM;')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT FROM;')

    const error1 = new Error('Syntax error')
    error1.code = 'ER_PARSE_ERROR'
    query.mockRejectedValueOnce(error1)

    await consultaController(req, res1)
    expect(res1.status).toHaveBeenCalledWith(400)

    const res2 = mockRes()
    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('SELECT FROM;')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT FROM;')

    const error2 = new Error('Syntax error')
    error2.code = 'ER_SYNTAX_ERROR'
    query.mockRejectedValueOnce(error2)

    await consultaController(req, res2)
    expect(res2.status).toHaveBeenCalledWith(400)
  })

  it('devuelve 500 si ocurre un error desconocido con o sin mensaje string', async () => {
    const req = { body: { question: 'consulta', run: true } }
    const res1 = mockRes()

    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('SELECT * FROM usuarios;')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT * FROM usuarios;')

    query.mockRejectedValueOnce(new Error('Conexión perdida'))

    await consultaController(req, res1)

    expect(res1.status).toHaveBeenCalledWith(500)
    expect(res1.json).toHaveBeenCalledWith({
      error: 'generar-consulta-failed',
      detail: 'Conexión perdida',
      sql: 'SELECT * FROM usuarios;'
    })

    const res2 = mockRes()
    validarCampos.mockReturnValueOnce()
    consultarGemini.mockResolvedValueOnce('SELECT * FROM usuarios;')
    normalizeGeneratedSql.mockReturnValueOnce('SELECT * FROM usuarios;')

    query.mockRejectedValueOnce('Error primitivo como string')

    await consultaController(req, res2)

    expect(res2.status).toHaveBeenCalledWith(500)
    expect(res2.json).toHaveBeenCalledWith({
      error: 'generar-consulta-failed',
      detail: 'Error primitivo como string',
      sql: 'SELECT * FROM usuarios;'
    })
  })
})
