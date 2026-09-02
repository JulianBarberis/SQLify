import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { errorHandler } from '../middlewares/errorHandler.js'

describe('errorHandler middleware', () => {
  let req, res, next, jsonMock, statusMock
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    req = { method: 'POST', originalUrl: '/api/test' }
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    res = { status: statusMock, json: jsonMock }
    next = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    jest.restoreAllMocks()
  })

  it('usa req.url si req.originalUrl no está presente', () => {
    const err = new Error('Test url fallback')
    errorHandler(err, { method: 'GET', url: '/fallback-url' }, res, next)
    expect(statusMock).toHaveBeenCalledWith(500)
  })

  it('handles JSON syntax error as 400 json-invalido', () => {
    const err = new SyntaxError('Unexpected token in JSON')
    err.status = 400
    err.body = '{ bad json'

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'json-invalido' })
    )
  })

  it('handles Rate Limit 429 errors con err.status y mensaje', () => {
    const err = new Error('Rate limit exceeded')
    err.status = 429

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(429)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'demasiadas-peticiones',
      detail: 'Rate limit exceeded'
    })
  })

  it('handles Rate Limit 429 errors con err.statusCode y sin mensaje custom', () => {
    const err = { statusCode: 429 }

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(429)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'demasiadas-peticiones',
      detail: 'Has superado el límite de peticiones permitidas.'
    })
  })

  it('handles ER_ACCESS_DENIED_ERROR as 403', () => {
    const err = new Error('Access denied')
    err.code = 'ER_ACCESS_DENIED_ERROR'

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(403)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'permiso-denegado' })
    )
  })

  it('handles ECONNREFUSED as 503', () => {
    const err = new Error('Connection refused')
    err.code = 'ECONNREFUSED'

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(503)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'base-datos-no-disponible' })
    )
  })

  it('handles PROTOCOL_CONNECTION_LOST as 503', () => {
    const err = new Error('Connection lost')
    err.code = 'PROTOCOL_CONNECTION_LOST'

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(503)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'base-datos-no-disponible' })
    )
  })

  it('oculta detalles técnicos en producción (NODE_ENV=production)', () => {
    process.env.NODE_ENV = 'production'
    const err = new Error('Fallo crítico con datos sensibles')

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(500)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error',
      detail: 'Ocurrió un error inesperado en el servidor.'
    })
  })

  it('respeta status codes entre 400 y 599', () => {
    const err = new Error('Teapot')
    err.status = 418

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(418)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error',
      detail: 'Teapot'
    })
  })

  it('usa fallback a 500 y error-interno cuando status y err.name están ausentes o fuera de rango', () => {
    const err = { status: 200 } // status fuera de rango de error

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(500)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'error-interno',
      detail: 'Error interno del servidor.'
    })
  })
})
