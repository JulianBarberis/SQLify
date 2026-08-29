import { query, closePool } from '../../db/db.js'
import { fetchSpotifyData } from '../fetchData.js'

const saveData = async () => {
  try {
    const { artists, albums, tracks } = await fetchSpotifyData()

    console.log(`Guardando ${artists.length} artistas en la base de datos...`)
    for (const artist of artists) {
      await query(
        `INSERT IGNORE INTO Artista (ID_Artista, nombre, seguidores, genero, popularidad, url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [artist.id, artist.name, artist.followers?.total || 0, artist.genres?.[0] || null, artist.popularity || 0, artist.external_urls?.spotify || null]
      )
    }

    console.log(`Guardando ${albums.length} álbumes en la base de datos...`)
    for (const album of albums) {
      await query(
        `INSERT IGNORE INTO Album (ID_Album, titulo, ano, tipo, total_canciones, url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [album.id, album.name, album.release_date?.slice(0, 4), album.album_type, album.total_tracks || 0, album.external_urls?.spotify || null]
      )

      // Relación album-artista
      if (album.artists) {
        for (const a of album.artists) {
          await query(
            `INSERT IGNORE INTO Album_artista (ID_Album, ID_Artista) VALUES (?, ?)`,
            [album.id, a.id]
          )
        }
      }
    }

    console.log(`Guardando ${tracks.length} canciones en la base de datos...`)
    for (const track of tracks) {
      await query(
        `INSERT IGNORE INTO Cancion (ID_Cancion, ID_Album, titulo, duracion, url, popularidad)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [track.id, track.album?.id, track.name, Math.floor(track.duration_ms / 1000), track.external_urls?.spotify || null, track.popularity || 0]
      )

      // Relación canción-artista
      if (track.artists) {
        for (const a of track.artists) {
          await query(
            `INSERT IGNORE INTO Cancion_artista (ID_Cancion, ID_Artista) VALUES (?, ?)`,
            [track.id, a.id]
          )
        }
      }
    }

    console.log('Datos de Spotify insertados correctamente en la base de datos ✅')
  } catch (error) {
    console.error('❌ Error durante la población de datos:', error.message || error)
  } finally {
    await closePool()
  }
}

saveData()
