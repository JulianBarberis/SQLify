import dotenv from 'dotenv'
import { Faker, es } from '@faker-js/faker'
import mysql from 'mysql2/promise'

// 1. Cargar variables de entorno (asegúrate de tener tu .env)
dotenv.config()

// 2. Configurar Faker
const faker = new Faker({ locale: [es] })

// 3. Configuración de la base de datos (leída del .env)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'sqlify' // Asegúrate que DB_NAME esté en tu .env
}

// --- Función principal para generar e insertar usuarios ---
async function generarUsuarios(cantidad) {
  let connection = null // Declaramos la conexión aquí para usarla en finally

  try {
    // 4. Crear una CONEXIÓN ÚNICA (no un pool)
    connection = await mysql.createConnection(dbConfig)
    console.log('¡Conectado a la base de datos "sqlify"!')

    // 5. Preparar la consulta SQL
    const sql = 'INSERT INTO usuario (nombre, email, plan, fecha_alta) VALUES (?, ?, ?, ?)'

    console.log(`Generando ${cantidad} usuarios falsos...`)

    // Bucle para crear cada usuario
    for (let i = 0; i < cantidad; i++) {
      // Generar datos falsos
      const nombre = faker.person.fullName()
      const email = faker.internet.email({ firstName: nombre.split(' ')[0] })
      const plan = faker.helpers.arrayElement(['free', 'premium'])
      const fecha_alta = faker.date.past({ years: 2 })
      const fechaSQL = fecha_alta.toISOString().split('T')[0]

      // Ejecutar la inserción
      await connection.execute(sql, [nombre, email, plan, fechaSQL])
    }

    console.log(`¡Éxito! Se insertaron ${cantidad} usuarios.`)

  } catch (error) {
    console.error('Error al insertar usuarios:', error)
  } finally {
    // 6. Cerrar la conexión (MUY IMPORTANTE)
    // Esto asegura que el script termine su ejecución
    if (connection) {
      await connection.end()
      console.log('Conexión cerrada.')
    }
  }
}

// --- Ejecutar la función ---
generarUsuarios(50) // Cambia 50 por la cantidad que quieras