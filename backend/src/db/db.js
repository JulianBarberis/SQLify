import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

let pool = null

export async function initPool() {
  if (!pool) {
    const dbName = process.env.DB_NAME || ''
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
    })

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