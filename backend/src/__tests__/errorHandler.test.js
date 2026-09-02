import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { errorHandler } from '../middlewares/errorHandler.js'

describe('errorHandler middleware', () => {
  let req, res, next, jsonMock, statusMock

  beforeEach(() => {
    req = { method: 'POST', originalUrl: '/api/test' }
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    res = { status: statusMock, json: jsonMock }
    next = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
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

  it('handles Rate Limit 429 errors', () => {
    const err = new Error('Rate limit exceeded')
    err.status = 429

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(429)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'demasiadas-peticiones' })
    )
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

  it('handles generic 500 error gracefully', () => {
    const err = new Error('Uncaught runtime failure')

    errorHandler(err, req, res, next)

    expect(statusMock).toHaveBeenCalledWith(500)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error' })
    )
  })
})
