// --- helper de sanitización ---

export function normalizeGeneratedSql(raw) {
  let s = (raw || '')
    // quita fences markdown y comentarios con codigo regex que no entiendo
    .replace(/```sql/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()

  // extrae desde el PRIMER SELECT que aparezca hasta el final
  const m = s.match(/select\b[\s\S]*$/i)
  s = m ? m[0].trim() : ''

  // si no empieza con SELECT -> null
  if (!/^\s*select\b/i.test(s)) return null

  // quita ; finales repetidos y asegura UNA sola sentencia
  s = s.replace(/;+\s*$/,'')

  // si aún quedaron múltiples statements (p. ej. "SELECT ...; DROP ..."),
  // nos quedamos solo con lo que está antes del primer ';'
  if (s.includes(';')) s = s.split(';')[0].trim()

  // defensa básica: bloquear DDL/DML peligrosos por si escaparon
  const banned = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke)\b/i
  if (banned.test(s)) return null

  return s
}

export function fallbackSql(msg='Consulta no relacionada con la base de datos') {
  // siempre SQL válido y seguro
  return `SELECT ${JSON.stringify(msg)} AS mensaje`
}
