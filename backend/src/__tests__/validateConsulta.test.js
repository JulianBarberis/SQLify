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

  it('returns 400 when req.body is undefined', () => {
    const req = {}
    const res = mockRes()
    const next = jest.fn()

    validateConsulta(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('question') }))
  })

  it('returns 400 if question is missing or empty or not a string', () => {
    const req1 = { body: { question: '   ', run: false } }
    const res1 = mockRes()
    const next1 = jest.fn()

    validateConsulta(req1, res1, next1)
    expect(res1.status).toHaveBeenCalledWith(400)

    const req2 = { body: { question: 12345, run: false } }
    const res2 = mockRes()
    const next2 = jest.fn()

    validateConsulta(req2, res2, next2)
    expect(res2.status).toHaveBeenCalledWith(400)
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

  it('returns 400 if limit is not a positive number or is NaN', () => {
    const req1 = { body: { question: 'test', run: true, limit: 0 } }
    const res1 = mockRes()
    const next1 = jest.fn()

    validateConsulta(req1, res1, next1)
    expect(res1.status).toHaveBeenCalledWith(400)

    const req2 = { body: { question: 'test', run: true, limit: NaN } }
    const res2 = mockRes()
    const next2 = jest.fn()

    validateConsulta(req2, res2, next2)
    expect(res2.status).toHaveBeenCalledWith(400)
  })
})
