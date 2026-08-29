import { query } from '../db/db.js'

export const pingDb = async (_req, res) => {
  try {
    const rows = await query('SELECT 1 AS ok')
    res.json({ db: rows[0]?.ok === 1 })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'DB down', detail: String(e.message || e) })
  }
}