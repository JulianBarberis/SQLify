import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function seedDatabase() {
  console.log('🚀 Iniciando script de seeding para SQLify...')

  const host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1'
  const port = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306)
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root'
  const password = process.env.DB_PASS || process.env.MYSQLPASSWORD || ''
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || ''

  console.log(`📡 Conectando a MySQL en ${host}:${port} como "${user}" (DB: "${database || 'default'}")...`)

  const config = {
    host,
    port,
    user,
    password,
    database: database || undefined,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 5
  }

  if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false }
  }

  let connection
  try {
    connection = await mysql.createConnection(config)
    console.log('✅ Conexión establecida con éxito.')

    if (database) {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database.replace(/[`\\]/g, '')}\`;`)
      await connection.query(`USE \`${database.replace(/[`\\]/g, '')}\`;`)
    }

    const dumpPath = path.resolve(__dirname, 'dump.sql')
    const fallbackPath = path.resolve(__dirname, '../../../SQLify.sql')

    const targetFile = fs.existsSync(dumpPath) ? dumpPath : fallbackPath

    if (!fs.existsSync(targetFile)) {
      throw new Error(`No se encontró el archivo SQL ni en ${dumpPath} ni en ${fallbackPath}`)
    }

    console.log(`📂 Leyendo archivo SQL: ${path.basename(targetFile)} (${(fs.statSync(targetFile).size / 1024 / 1024).toFixed(2)} MB)...`)
    let sqlContent = fs.readFileSync(targetFile, 'utf-8')

    if (database && database.toLowerCase() !== 'sqlify') {
      sqlContent = sqlContent
        .replace(/CREATE DATABASE IF NOT EXISTS `?SQLify`?;/gi, `-- omitido CREATE DATABASE SQLify`)
        .replace(/USE `?SQLify`?;/gi, `USE \`${database.replace(/[`\\]/g, '')}\`;`)
    }

    console.log('⏳ Ejecutando sentencias SQL en la base de datos...')
    const startTime = Date.now()
    await connection.query(sqlContent)
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`🎉 ¡Base de datos poblada exitosamente en ${duration}s!`)
  } catch (err) {
    console.error('❌ Error durante el proceso de seeding:', err.message || err)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

seedDatabase()
