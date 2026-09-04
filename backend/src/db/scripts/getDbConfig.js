import dotenv from 'dotenv'

dotenv.config()

export function getScriptDbConfig() {
  let host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1'
  let port = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306)
  let user = process.env.DB_USER || process.env.MYSQLUSER || 'root'
  let password = process.env.DB_PASS || process.env.MYSQLPASSWORD || ''
  let database = process.env.DB_NAME || process.env.MYSQLDATABASE || ''

  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl)
      host = parsed.hostname || host
      port = Number(parsed.port) || port
      user = parsed.username ? decodeURIComponent(parsed.username) : user
      password = parsed.password ? decodeURIComponent(parsed.password) : password
      database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : database
    } catch {
      // Ignorar URL no válida
    }
  }

  const config = {
    host,
    port,
    user,
    password,
    database: database || undefined,
    multipleStatements: true,
  }

  if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false }
  }

  return config
}
