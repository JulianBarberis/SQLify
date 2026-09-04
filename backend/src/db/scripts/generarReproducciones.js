import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { Faker, es, en } from '@faker-js/faker'
import { getScriptDbConfig } from './getDbConfig.js'

dotenv.config()

const faker = new Faker({ locale: [es, en] })

const DISPOSITIVOS = ['mobile', 'desktop', 'speaker']

export async function generarReproducciones(totalReproducciones = 2500, existingConnection = null) {
  let connection = existingConnection
  const shouldClose = !existingConnection
  const batchSize = 500

  console.log(`Iniciando generación de ${totalReproducciones} reproducciones...`)

  try {
    if (!connection) {
      const dbConfig = getScriptDbConfig()
      connection = await mysql.createConnection(dbConfig)
      console.log('Conectado a la base de datos.')
    }

    const [usuarios] = await connection.query('SELECT ID_Usuario FROM usuario')
    const [canciones] = await connection.query('SELECT ID_Cancion, duracion FROM cancion')

    if (usuarios.length === 0) throw new Error('No hay usuarios en la DB.')
    if (canciones.length === 0) throw new Error('No hay canciones en la DB.')

    console.log(`Datos maestros: ${usuarios.length} usuarios y ${canciones.length} canciones.`)

    const sql = 'INSERT INTO reproduccion (ID_Usuario, ID_Cancion, dispositivo, fecha, duracion) VALUES ?'
    let valuesBatch = []

    for (let i = 0; i < totalReproducciones; i++) {
      const usuario = faker.helpers.arrayElement(usuarios)
      const cancion = faker.helpers.arrayElement(canciones)
      const dispositivo = faker.helpers.arrayElement(DISPOSITIVOS)
      const fecha = faker.date.past({ years: 2 })

      const esEscuchaCompleta = Math.random() < 0.7 || cancion.duracion <= 30
      const duracionReproduccion = esEscuchaCompleta
        ? cancion.duracion
        : faker.number.int({ min: 15, max: Math.max(16, cancion.duracion - 1) })

      valuesBatch.push([
        usuario.ID_Usuario,
        cancion.ID_Cancion,
        dispositivo,
        fecha,
        duracionReproduccion
      ])

      if (valuesBatch.length === batchSize) {
        await connection.query(sql, [valuesBatch])
        valuesBatch = []
      }
    }

    if (valuesBatch.length > 0) {
      await connection.query(sql, [valuesBatch])
    }

    console.log(`✅ ¡Éxito! Total de ${totalReproducciones} reproducciones generadas.`)
  } catch (error) {
    console.error('Error al generar reproducciones:', error.message || error)
    throw error
  } finally {
    if (shouldClose && connection) {
      await connection.end()
      console.log('Conexión cerrada.')
    }
  }
}

const isDirectRun = process.argv[1]?.endsWith('generarReproducciones.js')
if (isDirectRun) {
  generarReproducciones(5000).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
