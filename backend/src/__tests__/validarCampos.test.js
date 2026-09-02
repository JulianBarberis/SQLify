import { jest } from '@jest/globals'
import { validarCampos } from '../utils/validarConsulta.js'

describe('validarCampos (utils/validarConsulta.js)', () => {
  let mockRes

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
  })

  it('retorna 400 si req.body es undefined', () => {
    validarCampos({}, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'question requerido (string no vacío)' })
  })

  it('retorna 400 si question no es string o está vacío', () => {
    validarCampos({ body: { question: '   ' } }, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)

    validarCampos({ body: { question: 123 } }, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it('retorna 400 si run no es booleano', () => {
    validarCampos({ body: { question: 'test', run: 'true' } }, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'run debe ser un boolean' })
  })

  it('retorna 400 si limit no es número', () => {
    validarCampos({ body: { question: 'test', run: true, limit: '10' } }, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'limit debe ser un number (max. 100)' })
  })

  it('retorna undefined si todos los campos son válidos', () => {
    const result = validarCampos({ body: { question: 'consulta válida', run: true, limit: 10 } }, mockRes)
    expect(result).toBeUndefined()
    expect(mockRes.status).not.toHaveBeenCalled()
  })

  it('acepta valores por defecto de run y limit cuando solo se provee question', () => {
    const result = validarCampos({ body: { question: 'consulta válida' } }, mockRes)
    expect(result).toBeUndefined()
    expect(mockRes.status).not.toHaveBeenCalled()
  })
})
