import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { getScriptDbConfig } from './getDbConfig.js'
import { generarUsuarios } from './generarUsuarios.js'
import { generarPlaylists } from './generarPlaylistsAleatorias.js'
import { generarReproducciones } from './generarReproducciones.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function seedDatabase(existingConnection = null) {
  console.log('🚀 Iniciando proceso de seeding completo para SQLify...')

  const config = getScriptDbConfig()
  const database = config.database
  const shouldClose = !existingConnection
  let connection = existingConnection

  try {
    if (!connection) {
      connection = await mysql.createConnection(config)
      console.log('✅ Conexión establecida con éxito.')
    }

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

    // Paso 1: Verificar si ya existen las canciones del catálogo
    const [tables] = await connection.query("SHOW TABLES LIKE 'cancion';")
    let hasSongs = false
    if (tables.length > 0) {
      const [cancionCount] = await connection.query('SELECT COUNT(*) AS total FROM cancion;')
      hasSongs = cancionCount[0]?.total > 0
    }

    if (!hasSongs) {
      console.log(`📂 Leyendo archivo SQL principal: ${path.basename(targetFile)}...`)
      let sqlContent = fs.readFileSync(targetFile, 'utf-8')

      if (database && database.toLowerCase() !== 'sqlify') {
        sqlContent = sqlContent
          .replace(/CREATE DATABASE IF NOT EXISTS `?SQLify`?;/gi, `-- omitido CREATE DATABASE SQLify`)
          .replace(/USE `?SQLify`?;/gi, `USE \`${database.replace(/[`\\]/g, '')}\`;`)
      }

      console.log('⏳ Ejecutando dump inicial (canciones, álbumes, artistas)...')
      await connection.query(sqlContent)
      console.log('✅ Catálogo de Spotify cargado con éxito.')
    } else {
      console.log('ℹ️ El catálogo de canciones ya se encontraba cargado.')
    }

    // Paso 2: Generar usuarios si la tabla está vacía
    const [userRows] = await connection.query('SELECT COUNT(*) AS total FROM usuario;')
    if (userRows[0]?.total === 0) {
      console.log('🌱 Generando 50 usuarios con Faker...')
      await generarUsuarios(50, connection)
    }

    // Paso 3: Generar playlists si la tabla está vacía
    const [playlistRows] = await connection.query('SELECT COUNT(*) AS total FROM playlist;')
    if (playlistRows[0]?.total === 0) {
      console.log('🌱 Generando 20 playlists aleatorias...')
      await generarPlaylists(20, connection)
    }

    // Paso 4: Generar reproducciones si la tabla está vacía
    const [reproRows] = await connection.query('SELECT COUNT(*) AS total FROM reproduccion;')
    if (reproRows[0]?.total === 0) {
      console.log('🌱 Generando historial de reproducciones...')
      await generarReproducciones(2500, connection)
    }

    console.log('🎉 ¡Base de datos completamente poblada y lista para consultas!')
  } catch (err) {
    console.error('❌ Error durante el proceso de seeding:', err.message || err)
    throw err
  } finally {
    if (shouldClose && connection) {
      await connection.end()
    }
  }
}

const isDirectRun = process.argv[1]?.endsWith('seed.js')
if (isDirectRun) {
  seedDatabase().catch(() => process.exit(1))
}
