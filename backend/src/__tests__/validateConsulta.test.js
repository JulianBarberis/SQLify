import { jest } from '@jest/globals'
import { validateConsulta } from '../middlewares/validateConsulta.js'

describe('validateConsulta middleware', () => {
  const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
  }

  it('calls next() for valid request payload', () => {
    const req = { body: { question: 'Traer artistas', run: true, limit: 50 } }
    const res = mockRes()
    const next = jest.fn()

    validateConsulta(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 400 if question is missing or empty', () => {
    const req = { body: { question: '   ', run: false } }
    const res = mockRes()
    const next = jest.fn()

    validateConsulta(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('question') }))
  })

  it('returns 400 if run is not a boolean', () => {
    const req = { body: { question: 'test', run: 'yes' } }
    const res = mockRes()
    const next = jest.fn()

    validateConsulta(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('run') }))
  })

  it('returns 400 if limit is not a positive number', () => {
    const req = { body: { question: 'test', run: true, limit: 0 } }
    const res = mockRes()
    const next = jest.fn()

    validateConsulta(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('limit') }))
  })
})
