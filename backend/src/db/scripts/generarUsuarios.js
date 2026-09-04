import dotenv from 'dotenv'
import { Faker, es } from '@faker-js/faker'
import mysql from 'mysql2/promise'
import { getScriptDbConfig } from './getDbConfig.js'

dotenv.config()

const faker = new Faker({ locale: [es] })

export async function generarUsuarios(cantidad = 50, existingConnection = null) {
  let connection = existingConnection
  const shouldClose = !existingConnection

  try {
    if (!connection) {
      const dbConfig = getScriptDbConfig()
      connection = await mysql.createConnection(dbConfig)
      console.log(`¡Conectado a MySQL para generar usuarios!`)
    }

    const sql = 'INSERT INTO usuario (nombre, email, plan, fecha_alta) VALUES (?, ?, ?, ?)'
    console.log(`Generando ${cantidad} usuarios falsos...`)

    for (let i = 0; i < cantidad; i++) {
      const nombre = faker.person.fullName()
      const email = `${faker.string.alphanumeric(8).toLowerCase()}_${faker.internet.email({ firstName: nombre.split(' ')[0] })}`
      const plan = faker.helpers.arrayElement(['free', 'premium'])
      const fecha_alta = faker.date.past({ years: 2 })
      const fechaSQL = fecha_alta.toISOString().split('T')[0]

      await connection.execute(sql, [nombre, email, plan, fechaSQL])
    }

    console.log(`✅ ¡Éxito! Se insertaron ${cantidad} usuarios.`)
  } catch (error) {
    console.error('Error al insertar usuarios:', error.message || error)
    throw error
  } finally {
    if (shouldClose && connection) {
      await connection.end()
      console.log('Conexión cerrada.')
    }
  }
}

// Ejecución directa por línea de comandos
const isDirectRun = process.argv[1]?.endsWith('generarUsuarios.js')
if (isDirectRun) {
  generarUsuarios(50).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
