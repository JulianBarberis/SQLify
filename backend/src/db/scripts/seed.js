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

    // Poblar tablas complementarias si están vacías (usuario, playlist, reproduccion)
    const [userCount] = await connection.query('SELECT COUNT(*) AS total FROM usuario;')
    if (userCount[0]?.total === 0) {
      console.log('🌱 Poblando datos complementarios para usuario, playlist y reproduccion...')
      const demoDataSql = `
        INSERT INTO usuario (ID_Usuario, nombre, email, plan, fecha_alta) VALUES
        (1, 'Julian Barberis', 'julian@example.com', 'premium', '2023-01-15'),
        (2, 'Camila Rossi', 'camila@example.com', 'premium', '2023-02-10'),
        (3, 'Mateo Fernandez', 'mateo@example.com', 'free', '2023-03-05'),
        (4, 'Sofia Gomez', 'sofia@example.com', 'premium', '2023-04-12'),
        (5, 'Lucas Martinez', 'lucas@example.com', 'free', '2023-05-20'),
        (6, 'Valentina Lopez', 'valentina@example.com', 'premium', '2023-06-18'),
        (7, 'Santiago Diaz', 'santiago@example.com', 'premium', '2023-07-22'),
        (8, 'Agustina Perez', 'agustina@example.com', 'free', '2023-08-30');

        INSERT INTO playlist (ID_Playlist, ID_Usuario, titulo, fecha_creacion) VALUES
        (1, 1, 'Top Rock Clásico', '2023-02-01'),
        (2, 2, 'Éxitos en Español', '2023-03-15'),
        (3, 4, 'Gym Workout', '2023-05-01'),
        (4, 6, 'Chill & Relax', '2023-07-10'),
        (5, 7, 'Descubrimiento Semanal', '2023-08-01');

        INSERT INTO reproduccion (ID_Usuario, ID_Cancion, dispositivo, fecha, duracion)
        SELECT 
          (1 + (id_num % 8)) AS ID_Usuario,
          c.ID_Cancion,
          ELT(1 + (id_num % 3), 'mobile', 'desktop', 'speaker') AS dispositivo,
          DATE_SUB(NOW(), INTERVAL (id_num * 3) HOUR) AS fecha,
          c.duracion
        FROM (
          SELECT ID_Cancion, duracion, ROW_NUMBER() OVER (ORDER BY popularidad DESC) AS id_num
          FROM cancion
          LIMIT 50
        ) AS c;
      `
      await connection.query(demoDataSql)
      console.log('✅ Datos de usuarios, playlists y reproducciones creados correctamente.')
    }

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
