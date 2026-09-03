import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { Faker, es, en } from '@faker-js/faker' // Importamos 'en' por si acaso

// 1. Cargar variables de entorno
dotenv.config()

// 2. Configurar Faker (con 'en' como fallback)
const faker = new Faker({ locale: [es, en] })

// 3. Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'sqlify'
}

// --- CONFIGURACIÓN DE LA SIMULACIÓN ---
const TOTAL_REPRODUCCIONES = 50000 // Total de "escuchas" a simular
const BATCH_SIZE = 1000 // Cuántos INSERTs agrupar en cada consulta
const DISPOSITIVOS = ['mobile', 'desktop', 'speaker'] 

// --- Función principal ---
async function generarReproducciones() {
  let connection = null
  console.log('Iniciando script de generación de reproducciones...')

  try {
    // 4. Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig)
    console.log('Conectado a la base de datos.')

    // --- PASO 1: Obtener todos los IDs de usuarios y canciones (con su duración) ---
    console.log('Obteniendo datos maestros (usuarios y canciones)...')
    const [usuarios] = await connection.query('SELECT ID_Usuario FROM Usuario')
    
    // ¡Crítico! Necesitamos la duración MÁXIMA de cada canción
    const [canciones] = await connection.query('SELECT ID_Cancion, duracion FROM Cancion')

    if (usuarios.length === 0) throw new Error('No hay usuarios en la DB.')
    if (canciones.length === 0) throw new Error('No hay canciones en la DB.')

    console.log(`Datos obtenidos: ${usuarios.length} usuarios y ${canciones.length} canciones.`)

    // --- PASO 2: Bucle principal para generar ${TOTAL_REPRODUCCIONES} escuchas ---
    
    const sql = 'INSERT INTO Reproduccion (ID_Usuario, ID_Cancion, dispositivo, fecha, duracion) VALUES ?'
    let valuesBatch = [] // Array para el lote actual

    console.log(`Iniciando generación de ${TOTAL_REPRODUCCIONES} registros en lotes de ${BATCH_SIZE}...`)

    for (let i = 0; i < TOTAL_REPRODUCCIONES; i++) {
      
      // a. Elegir un usuario al azar
      const usuario = faker.helpers.arrayElement(usuarios)
      // b. Elegir una canción al azar
      const cancion = faker.helpers.arrayElement(canciones)
      // c. Elegir un dispositivo al azar
      const dispositivo = faker.helpers.arrayElement(DISPOSITIVOS)
      // d. Elegir una fecha aleatoria (en los últimos 2 años)
      const fecha = faker.date.past({ years: 2 })

      // e. Calcular la duración de la escucha (Lógica Realista)
      let duracionReproduccion
      // 70% de probabilidad de escucharla completa (o si dura menos de 30s)
      const esEscuchaCompleta = Math.random() < 0.7 || cancion.duracion <= 30
      
      if (esEscuchaCompleta) {
        duracionReproduccion = cancion.duracion // Escucha completa
      } else {
        // Escucha parcial (al menos 15s, pero no completa)
        duracionReproduccion = faker.number.int({ min: 15, max: cancion.duracion - 1 })
      }

      // f. Agregar al lote
      valuesBatch.push([
        usuario.ID_Usuario,
        cancion.ID_Cancion,
        dispositivo,
        fecha,
        duracionReproduccion
      ])

      // --- PASO 3: Ejecutar el lote si está lleno ---
      if (valuesBatch.length === BATCH_SIZE) {
        await connection.query(sql, [valuesBatch])
        valuesBatch = [] // Limpiar el lote
        // Damos feedback para saber que no se colgó
        process.stdout.write(`  ...Registros insertados: ${i + 1}/${TOTAL_REPRODUCCIONES}\r`)
      }
    }

    // --- PASO 4: Insertar el último lote (los registros sobrantes) ---
    if (valuesBatch.length > 0) {
      await connection.query(sql, [valuesBatch])
      console.log(`\n¡Éxito! Se insertó el último lote de ${valuesBatch.length} registros.`)
    }

    console.log(`Proceso completado. Total de ${TOTAL_REPRODUCCIONES} reproducciones generadas.`)

  } catch (error) {
    console.error('\nError durante el proceso:', error)
  } finally {
    // 7. Cerrar la conexión
    if (connection) {
      await connection.end()
      console.log('Conexión cerrada.')
    }
  }
}

// --- Ejecutar la función ---
generarReproducciones()