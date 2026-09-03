import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { Faker, es, en } from '@faker-js/faker'

// 1. Cargar variables de entorno
dotenv.config()

// 2. Configurar Faker
const faker = new Faker({ locale: [es, en] })

// 3. Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'sqlify'
}

// --- Función para seleccionar elementos aleatorios de un array ---
function obtenerElementosAleatorios(arr, cantidad) {
  // Mezcla el array (copia) y toma los primeros 'cantidad' elementos
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, cantidad)
}

// --- Función principal ---
async function generarMultiplesPlaylists(cantidadACrear = 20) {
  let connection = null
  console.log(`Iniciando script: Creando ${cantidadACrear} playlists...`)

  try {
    // 4. Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig)
    console.log('Conectado a la base de datos.')

    // --- PASO 1: Obtener todos los IDs de usuarios y canciones ---
    console.log('Obteniendo datos maestros (usuarios y canciones)...')
    const [usuarios] = await connection.query('SELECT ID_Usuario FROM Usuario')
    const [canciones] = await connection.query('SELECT ID_Cancion FROM Cancion')

    if (usuarios.length === 0) {
      throw new Error('No se pueden crear playlists. No hay usuarios en la DB.')
    }
    if (canciones.length === 0) {
      throw new Error('No se pueden crear playlists. No hay canciones en la DB.')
    }

    console.log(`Datos obtenidos: ${usuarios.length} usuarios y ${canciones.length} canciones.`)

    // --- PASO 2: Bucle principal para crear cada playlist ---
    for (let i = 0; i < cantidadACrear; i++) {
      
      // a. Elegir un usuario al azar
      const usuarioAleatorio = faker.helpers.arrayElement(usuarios)
      
      // b. Crear la fila en la tabla `Playlist`
      const tituloPlaylist = `Playlist de ${faker.music.genre()}`
      const fechaCreacion = faker.date.past({ years: 2 }) // Fecha en los últimos 2 años
      
      const sqlPlaylist = 'INSERT INTO Playlist (ID_Usuario, titulo, fecha_creacion) VALUES (?, ?, ?)'
      const [resultadoPlaylist] = await connection.execute(sqlPlaylist, [
        usuarioAleatorio.ID_Usuario,
        tituloPlaylist,
        fechaCreacion
      ])
      
      // c. Obtener el ID de la playlist recién creada
      const nuevaPlaylistID = resultadoPlaylist.insertId
      console.log(`  -> Playlist ${i + 1}/${cantidadACrear} (ID: ${nuevaPlaylistID}) creada para usuario ${usuarioAleatorio.ID_Usuario}.`)

      // d. Decidir cuántas canciones agregar (entre 15 y 50)
      const numCanciones = faker.number.int({ min: 15, max: 50 })
      
      // e. Seleccionar canciones aleatorias
      const cancionesParaPlaylist = obtenerElementosAleatorios(canciones, numCanciones)

      // f. Preparar la inserción por lotes (Batch Insert)
      const fechaAgregada = new Date()
      const valuesPivote = cancionesParaPlaylist.map((cancion, index) => {
        return [
          nuevaPlaylistID,       // ID_Playlist
          cancion.ID_Cancion,  // ID_Cancion
          fechaAgregada,         // fecha_agregada
          index + 1              // orden
        ]
      })

      // Si no hay canciones, saltar la inserción (aunque no debería pasar)
      if (valuesPivote.length === 0) continue

      // Ejecutar la inserción por lotes
      const sqlPivote = 'INSERT INTO Playlist_cancion (ID_Playlist, ID_Cancion, fecha_agregada, orden) VALUES ?'
      // Nota: `connection.query` con `VALUES ?` y un array 2D
      // automáticamente formatea la inserción múltiple.
      await connection.query(sqlPivote, [valuesPivote])

      console.log(`     ...se agregaron ${cancionesParaPlaylist.length} canciones.`)
    }

    console.log(`¡Éxito! Se crearon y poblaron ${cantidadACrear} playlists.`)

  } catch (error) {
    console.error('Error durante el proceso:', error)
  } finally {
    // 7. Cerrar la conexión
    if (connection) {
      await connection.end()
      console.log('Conexión cerrada.')
    }
  }
}

// --- Ejecutar la función ---
// Cambia este número por la cantidad de playlists que quieras crear
generarMultiplesPlaylists(50)