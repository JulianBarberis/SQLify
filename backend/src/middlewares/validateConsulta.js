export const validateConsulta = (req, res, next) => {
  const { question, run = false, limit = 100 } = req.body || {}

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question requerido (string no vacío)' })
  }

  if (question.length > 500) {
    return res.status(400).json({ error: 'question excede el límite permitido (máximo 500 caracteres)' })
  }

  if (typeof run !== 'boolean') {
    return res.status(400).json({ error: 'run debe ser un boolean' })
  }

  const numLimit = Number(limit)
  if (typeof limit !== 'number' || isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
    return res.status(400).json({ error: 'limit debe ser un number válido (1 - 100)' })
  }

  next()
}
