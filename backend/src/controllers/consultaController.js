import { query } from '../db/db.js'
import { consultarGemini } from '../utils/gemini.js'
import demoDDL from '../utils/schema.js'
import { normalizeGeneratedSql } from '../utils/normalizarSql.js'

export const consultaController = async (req, res) => {
  let cleanSql
  try {
    const { question, run = false, limit = 100 } = req.body || {}
    const hardLimit = Math.max(1, Math.min(Number(limit), 100))

    let sql = await consultarGemini({ question, schemaDDL: demoDDL, limit: hardLimit })

    /* Limpiar y validar AST del SQL generado */
    cleanSql = normalizeGeneratedSql(sql)

    if (!cleanSql) {
      return res.status(400).json({
        error: 'Hubo un error en la consulta',
        sql: sql,
        detail: 'La consulta SQL generada por Gemini es inválida o no cumple con las políticas de seguridad. Por favor inténtelo de nuevo reformulando su consulta.'
      })
    }

    // Si no queremos ejecutar todavía:
    if (run === false) {
      return res.json({ sql: cleanSql, explain: 'Consulta SQL generada por GeminiAPI.' })
    }

    // Ejecutar contra la DB (usuario readonly)
    const rows = await query(cleanSql)
    return res.json({
      sql: cleanSql,
      explain: 'Consulta SQL generada por GeminiAPI.',
      executed: { rowCount: rows.length, rows }
    })
  } catch (e) {
    console.error('ERROR:', e)

    const msg = String(e.message || e.sqlMessage || '').toLowerCase()

    if (e.code === 'ER_ACCESS_DENIED_ERROR' || msg.includes('command denied')) {
      return res.status(403).json({
        error: 'permiso-denegado',
        detail: 'El usuario actual no tiene permisos suficientes para ejecutar esta consulta (probablemente un INSERT, UPDATE o DELETE).',
        sql: cleanSql
      })
    }

    if (e.code === 'ER_PARSE_ERROR' || e.code === 'ER_SYNTAX_ERROR') {
      return res.status(400).json({
        error: 'consulta-sql-invalida',
        detail: 'La consulta SQL generada tiene un error de sintaxis.',
        sql: cleanSql
      })
    }

    // Fallback: error general
    return res.status(500).json({
      error: 'generar-consulta-failed',
      detail: String(e.message || e),
      sql: cleanSql
    })
  }
}