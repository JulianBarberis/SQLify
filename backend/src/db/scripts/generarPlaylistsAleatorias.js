import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { Faker, es, en } from '@faker-js/faker'
import { getScriptDbConfig } from './getDbConfig.js'

dotenv.config()

const faker = new Faker({ locale: [es, en] })

function obtenerElementosAleatorios(arr, cantidad) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, cantidad)
}

export async function generarPlaylists(cantidadACrear = 20, existingConnection = null) {
  let connection = existingConnection
  const shouldClose = !existingConnection

  console.log(`Iniciando generación de ${cantidadACrear} playlists...`)

  try {
    if (!connection) {
      const dbConfig = getScriptDbConfig()
      connection = await mysql.createConnection(dbConfig)
      console.log('Conectado a la base de datos.')
    }

    const [usuarios] = await connection.query('SELECT ID_Usuario FROM usuario')
    const [canciones] = await connection.query('SELECT ID_Cancion FROM cancion')

    if (usuarios.length === 0) {
      throw new Error('No se pueden crear playlists. No hay usuarios en la DB.')
    }
    if (canciones.length === 0) {
      throw new Error('No se pueden crear playlists. No hay canciones en la DB.')
    }

    console.log(`Datos maestros: ${usuarios.length} usuarios y ${canciones.length} canciones.`)

    for (let i = 0; i < cantidadACrear; i++) {
      const usuarioAleatorio = faker.helpers.arrayElement(usuarios)
      const tituloPlaylist = `Playlist de ${faker.music.genre()}`
      const fechaCreacion = faker.date.past({ years: 2 })

      const sqlPlaylist = 'INSERT INTO playlist (ID_Usuario, titulo, fecha_creacion) VALUES (?, ?, ?)'
      const [resultadoPlaylist] = await connection.execute(sqlPlaylist, [
        usuarioAleatorio.ID_Usuario,
        tituloPlaylist,
        fechaCreacion
      ])

      const nuevaPlaylistID = resultadoPlaylist.insertId
      const numCanciones = faker.number.int({ min: 10, max: 30 })
      const cancionesParaPlaylist = obtenerElementosAleatorios(canciones, numCanciones)

      const fechaAgregada = new Date()
      const valuesPivote = cancionesParaPlaylist.map((cancion, index) => {
        return [
          nuevaPlaylistID,
          cancion.ID_Cancion,
          fechaAgregada,
          index + 1
        ]
      })

      if (valuesPivote.length > 0) {
        const sqlPivote = 'INSERT INTO playlist_cancion (ID_Playlist, ID_Cancion, fecha_agregada, orden) VALUES ?'
        await connection.query(sqlPivote, [valuesPivote])
      }
    }

    console.log(`✅ ¡Éxito! Se crearon y poblaron ${cantidadACrear} playlists.`)
  } catch (error) {
    console.error('Error durante la generación de playlists:', error.message || error)
    throw error
  } finally {
    if (shouldClose && connection) {
      await connection.end()
      console.log('Conexión cerrada.')
    }
  }
}

const isDirectRun = process.argv[1]?.endsWith('generarPlaylistsAleatorias.js')
if (isDirectRun) {
  generarPlaylists(20).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
