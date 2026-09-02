import { jest } from '@jest/globals'

jest.unstable_mockModule('../db/db.js', () => ({
  query: jest.fn()
}))

const { query } = await import('../db/db.js')
const { pingDb } = await import('../controllers/pingDb.js')

describe('pingDb (controllers/pingDb.js)', () => {
  let mockRes
  const originalError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    }
  })

  afterAll(() => {
    console.error = originalError
  })

  it('retorna { db: true } si la consulta retorna ok === 1', async () => {
    query.mockResolvedValueOnce([{ ok: 1 }])

    await pingDb({}, mockRes)

    expect(query).toHaveBeenCalledWith('SELECT 1 AS ok')
    expect(mockRes.json).toHaveBeenCalledWith({ db: true })
  })

  it('retorna { db: false } si la consulta retorna filas vacías o ok !== 1', async () => {
    query.mockResolvedValueOnce([])

    await pingDb({}, mockRes)

    expect(mockRes.json).toHaveBeenCalledWith({ db: false })
  })

  it('retorna 500 y error si la base de datos lanza una excepción con mensaje', async () => {
    query.mockRejectedValueOnce(new Error('Conexión rehusada'))

    await pingDb({}, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'DB down',
      detail: 'Conexión rehusada'
    })
  })

  it('retorna 500 y maneja excepciones que no son instancias de Error', async () => {
    query.mockRejectedValueOnce('Error crítico de socket')

    await pingDb({}, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'DB down',
      detail: 'Error crítico de socket'
    })
  })
})
