import pkg from 'node-sql-parser'
const { Parser } = pkg

const parser = new Parser()

const ALLOWED_TABLES = new Set([
  'usuario',
  'artista',
  'album',
  'cancion',
  'reproduccion',
  'playlist',
  'cancion_artista',
  'album_artista',
  'playlist_cancion'
])

const BANNED_PATTERNS = [
  /\bsleep\s*\(/i,
  /\bbenchmark\s*\(/i,
  /\bload_file\s*\(/i,
  /\bsys_eval\s*\(/i,
  /\bsys_exec\s*\(/i,
  /\binto\s+(?:outfile|dumpfile)\b/i
]

export function normalizeGeneratedSql(raw) {
  if (!raw || typeof raw !== 'string') return null

  // Limpiar markdown fences y comentarios
  let clean = raw
    .replace(/```sql/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()

  // Extraer desde el primer SELECT
  const m = clean.match(/select\b[\s\S]*$/i)
  clean = m ? m[0].trim() : ''
  if (!clean) return null

  // Quitar punto y coma final
  clean = clean.replace(/;+\s*$/, '')
  if (clean.includes(';')) {
    clean = clean.split(';')[0].trim()
  }

  // Auto-corregir LIMIT colgante sin número
  if (/\blimit\s*$/i.test(clean)) {
    clean = clean.replace(/\blimit\s*$/i, 'LIMIT 100')
  }

  // Comprobar patrones prohibidos en texto
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(clean)) {
      return null
    }
  }

  try {
    let ast
    try {
      ast = parser.astify(clean, { database: 'mariadb' })
    } catch {
      ast = parser.astify(clean, { database: 'mysql' })
    }
    const statements = Array.isArray(ast) ? ast : [ast]

    // Exactamente 1 statement y debe ser SELECT
    if (statements.length !== 1) return null
    if (statements[0].type !== 'select') return null

    // Validar tablas involucradas
    let tableList
    try {
      tableList = parser.tableList(clean, { database: 'mariadb' })
    } catch {
      tableList = parser.tableList(clean, { database: 'mysql' })
    }
    if (!tableList || tableList.length === 0) return null

    for (const tbl of tableList) {
      const parts = tbl.split('::')
      const tableName = parts[parts.length - 1]?.toLowerCase()
      if (!tableName || !ALLOWED_TABLES.has(tableName)) {
        return null
      }
    }

    // Normalizar nombres de tablas a minúsculas exactas para compatibilidad con sistemas de archivos Linux (MySQL case-sensitivity)
    const orderedTables = [
      'cancion_artista',
      'album_artista',
      'playlist_cancion',
      'reproduccion',
      'playlist',
      'cancion',
      'artista',
      'album',
      'usuario'
    ]
    for (const tbl of orderedTables) {
      clean = clean.replace(new RegExp(`\\b${tbl}\\b`, 'gi'), tbl)
    }

    return clean
  } catch {
    // Si la consulta no es válida según la gramática SQL
    return null
  }
}

export function fallbackSql(msg = 'Consulta no relacionada con la base de datos') {
  return `SELECT ${JSON.stringify(msg)} AS mensaje`
}
