import { query, closePool } from '../../db/db.js'
import { fetchSpotifyData } from '../fetchData.js'

const saveData = async () => {
  try {
    const { artists, albums, tracks } = await fetchSpotifyData()

    // 1. Inserción por lote de Artistas
    if (artists.length > 0) {
      console.log(`Guardando ${artists.length} artistas en la base de datos (batch)...`)
      const artistRows = artists.map(artist => [
        artist.id,
        artist.name,
        artist.followers?.total || 0,
        artist.genres?.[0] || null,
        artist.popularity || 0,
        artist.external_urls?.spotify || null
      ])
      await query(
        'INSERT IGNORE INTO Artista (ID_Artista, nombre, seguidores, genero, popularidad, url) VALUES ?',
        [artistRows]
      )
    }

    // 2. Inserción por lote de Álbumes y relaciones Álbum-Artista
    if (albums.length > 0) {
      console.log(`Guardando ${albums.length} álbumes en la base de datos (batch)...`)
      const albumRows = albums.map(album => [
        album.id,
        album.name,
        album.release_date?.slice(0, 4) || null,
        album.album_type,
        album.total_tracks || 0,
        album.external_urls?.spotify || null
      ])
      await query(
        'INSERT IGNORE INTO Album (ID_Album, titulo, ano, tipo, total_canciones, url) VALUES ?',
        [albumRows]
      )

      const albumArtistRows = []
      for (const album of albums) {
        if (album.artists) {
          for (const a of album.artists) {
            albumArtistRows.push([album.id, a.id])
          }
        }
      }
      if (albumArtistRows.length > 0) {
        await query(
          'INSERT IGNORE INTO Album_artista (ID_Album, ID_Artista) VALUES ?',
          [albumArtistRows]
        )
      }
    }

    // 3. Inserción por lote de Canciones y relaciones Canción-Artista
    if (tracks.length > 0) {
      console.log(`Guardando ${tracks.length} canciones en la base de datos (batch)...`)
      const trackRows = tracks.map(track => [
        track.id,
        track.album?.id,
        track.name,
        Math.floor((track.duration_ms || 0) / 1000),
        track.external_urls?.spotify || null,
        track.popularity || 0
      ])
      await query(
        'INSERT IGNORE INTO Cancion (ID_Cancion, ID_Album, titulo, duracion, url, popularidad) VALUES ?',
        [trackRows]
      )

      const trackArtistRows = []
      for (const track of tracks) {
        if (track.artists) {
          for (const a of track.artists) {
            trackArtistRows.push([track.id, a.id])
          }
        }
      }
      if (trackArtistRows.length > 0) {
        await query(
          'INSERT IGNORE INTO Cancion_artista (ID_Cancion, ID_Artista) VALUES ?',
          [trackArtistRows]
        )
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
