export const validarCampos = (req, res) => {
  const { question, run = false, limit = 100 } = req.body || {}

  // Validaciones
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question requerido (string no vacío)' })
  }
  if (typeof run !== 'boolean') {
    return res.status(400).json({ error: 'run debe ser un boolean' })
  }
  if (typeof limit !== 'number') {
    return res.status(400).json({ error: 'limit debe ser un number (max. 100)' })
  }
}