import { jest } from '@jest/globals'

const mockConn = {
  query: jest.fn().mockResolvedValue([[]]),
  release: jest.fn()
}

const mockPool = {
  getConnection: jest.fn().mockResolvedValue(mockConn),
  query: jest.fn().mockResolvedValue([[{ id: 1, name: 'Item' }], []]),
  end: jest.fn().mockResolvedValue(true)
}

const mockCreatePool = jest.fn().mockReturnValue(mockPool)

jest.unstable_mockModule('mysql2/promise', () => ({
  default: {
    createPool: mockCreatePool
  }
}))

const { initPool, query, closePool } = await import('../db/db.js')

describe('db (db/db.js)', () => {
  beforeEach(async () => {
    await closePool()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await closePool()
  })

  it('initPool crea el pool y ejecuta USE database la primera vez', async () => {
    process.env.DB_NAME = 'sqlify_test'
    process.env.DB_HOST = 'localhost'
    process.env.DB_PORT = '3306'
    process.env.DB_USER = 'testuser'
    process.env.DB_PASS = 'secret'

    const pool = await initPool()

    expect(mockCreatePool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: 3306,
        user: 'testuser',
        password: 'secret',
        database: 'sqlify_test'
      })
    )
    expect(mockPool.getConnection).toHaveBeenCalled()
    expect(mockConn.query).toHaveBeenCalledWith('USE sqlify_test')
    expect(mockConn.release).toHaveBeenCalled()
    expect(pool).toBe(mockPool)
  })

  it('initPool usa variables por defecto si no están definidas', async () => {
    delete process.env.DB_HOST
    delete process.env.DB_PORT
    delete process.env.DB_USER
    delete process.env.DB_PASS
    delete process.env.DB_NAME

    const pool = await initPool()

    expect(mockCreatePool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: ''
      })
    )
    expect(pool).toBe(mockPool)
  })

  it('initPool reutiliza el pool existente si ya fue inicializado', async () => {
    await initPool()
    expect(mockCreatePool).toHaveBeenCalledTimes(1)

    // Segunda llamada
    const samePool = await initPool()
    expect(mockCreatePool).toHaveBeenCalledTimes(1)
    expect(samePool).toBe(mockPool)
  })

  it('query ejecuta la consulta con parámetros sobre el pool y retorna data', async () => {
    const rows = await query('SELECT * FROM test WHERE id = ?', [1])

    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1])
    expect(rows).toEqual([{ id: 1, name: 'Item' }])
  })

  it('query usa array vacío de params si no se proveen', async () => {
    await query('SELECT 1')
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1', [])
  })

  it('closePool cierra el pool si está abierto y es idempotente si ya está cerrado', async () => {
    await initPool()
    await closePool()
    expect(mockPool.end).toHaveBeenCalledTimes(1)

    // Llamada redundante cuando pool es null
    await closePool()
    expect(mockPool.end).toHaveBeenCalledTimes(1)
  })
})
