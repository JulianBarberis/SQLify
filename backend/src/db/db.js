import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

let pool = null

export async function initPool() {
  if (!pool) {
    const host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1'
    const port = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306)
    const user = process.env.DB_USER || process.env.MYSQLUSER || 'root'
    const password = process.env.DB_PASS || process.env.MYSQLPASSWORD || ''
    const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || ''

    const config = {
      host,
      port,
      user,
      password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
    }

    if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false }
    }

    pool = mysql.createPool(config)

    if (dbName) {
      const conn = await pool.getConnection()
      const sanitizedDbName = dbName.replace(/[`\\]/g, '')
      await conn.query(`USE \`${sanitizedDbName}\``)
      conn.release()
    }
  }

  return pool
}

export async function query(sql, params = []) {
  const pool = await initPool() 
  const [data] = await pool.query(sql, params)
  return data
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}