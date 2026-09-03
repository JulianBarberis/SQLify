import { jest } from '@jest/globals'

const mockGenerateContent = jest.fn()
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent
})

class MockGoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.getGenerativeModel = mockGetGenerativeModel
  }
}

jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: MockGoogleGenerativeAI
}))

const { consultarGemini } = await import('../utils/gemini.js')

describe('consultarGemini (utils/gemini.js)', () => {
  const originalEnv = process.env
  const originalWarn = console.warn

  beforeEach(() => {
    jest.clearAllMocks()
    console.warn = jest.fn()
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' }
    delete process.env.GEMINI_MODEL
  })

  afterAll(() => {
    process.env = originalEnv
    console.warn = originalWarn
  })

  it('lanza un error si falta GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY

    await expect(
      consultarGemini({ question: 'top artistas', schemaDDL: 'schema', limit: 10 })
    ).rejects.toThrow('Falta configurar GEMINI_API_KEY en las variables de entorno (.env).')
  })

  it('usa modelo por defecto gemini-3.5-flash-lite cuando GEMINI_MODEL no está definido', async () => {
    delete process.env.GEMINI_MODEL

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'SELECT * FROM Artista'
      }
    })

    const sql = await consultarGemini({ question: 'artistas', schemaDDL: 'schema', limit: 5 })

    expect(sql).toBe('SELECT * FROM Artista')
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.5-flash-lite'
      })
    )
  })

  it('genera y normaliza la consulta SQL eliminando bloques markdown y saltos de línea', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => '```sql\nSELECT * FROM Artista\nORDER BY seguidores DESC\n```'
      }
    })

    const sql = await consultarGemini({ question: 'top artistas', schemaDDL: 'schema', limit: 5 })

    expect(sql).toBe('SELECT * FROM Artista ORDER BY seguidores DESC')
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.5-flash-lite',
        generationConfig: { temperature: 0.0, maxOutputTokens: 1000 }
      })
    )
  })

  it('conmuta al siguiente modelo si el primero falla con error que no tiene message', async () => {
    // Error primitivo sin .message para cubrir la rama e.message || e
    mockGenerateContent
      .mockRejectedValueOnce('Error de red primitivo')
      .mockResolvedValueOnce({
        response: {
          text: () => 'SELECT * FROM Cancion LIMIT 10'
        }
      })

    const sql = await consultarGemini({ question: 'canciones', schemaDDL: 'schema', limit: 10 })

    expect(sql).toBe('SELECT * FROM Cancion LIMIT 10')
    expect(console.warn).toHaveBeenCalledWith(
      'Aviso: Modelo Gemini gemini-3.5-flash-lite falló:',
      'Error de red primitivo'
    )
  })

  it('maneja respuestas vacías de Gemini intentando con el siguiente modelo', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => ''
        }
      })
      .mockResolvedValueOnce({
        response: {
          text: () => 'SELECT id FROM Usuario'
        }
      })

    const sql = await consultarGemini({ question: 'usuarios', schemaDDL: 'schema', limit: 10 })
    expect(sql).toBe('SELECT id FROM Usuario')
  })

  it('lanza error consolidado con mensaje si todos los modelos fallan con Error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Cuota agotada 429'))

    await expect(
      consultarGemini({ question: 'test', schemaDDL: 'schema', limit: 10 })
    ).rejects.toThrow(/Hubo un error al enviar la consulta a Gemini: Cuota agotada 429/)
  })

  it('lanza error consolidado con string si todos los modelos fallan con error primitivo', async () => {
    mockGenerateContent.mockRejectedValue('Fallo primitivo sin message')

    await expect(
      consultarGemini({ question: 'test', schemaDDL: 'schema', limit: 10 })
    ).rejects.toThrow(/Hubo un error al enviar la consulta a Gemini: Fallo primitivo sin message/)
  })

  it('usa GEMINI_MODEL personalizado si está definido en variables de entorno', async () => {
    process.env.GEMINI_MODEL = 'gemini-pro-custom'
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'SELECT 1'
      }
    })

    const sql = await consultarGemini({ question: 'test', schemaDDL: 'schema', limit: 10 })

    expect(sql).toBe('SELECT 1')
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-pro-custom'
      })
    )
  })

  it('maneja timeouts en la llamada a generateContent', async () => {
    jest.useFakeTimers()

    mockGenerateContent.mockImplementation(() => new Promise(() => {}))

    const assertion = expect(
      consultarGemini({ question: 'test', schemaDDL: 'schema', limit: 10 })
    ).rejects.toThrow(/Tiempo de espera/)

    for (let i = 0; i < 5; i++) {
      await jest.advanceTimersByTimeAsync(21000)
    }

    await assertion
    jest.useRealTimers()
  })
})

  it('lanza Error desconocido si no hay modelos candidatos o lastError es nulo', async () => {
    const origFilter = Array.prototype.filter
    Array.prototype.filter = function () {
      if (this.includes('gemini-3.5-flash-lite')) {
        return []
      }
      return origFilter.apply(this, arguments)
    }

    await expect(
      consultarGemini({ question: 'test', schemaDDL: 'schema', limit: 10 })
    ).rejects.toThrow('Hubo un error al enviar la consulta a Gemini: Error desconocido')

    Array.prototype.filter = origFilter
  })
