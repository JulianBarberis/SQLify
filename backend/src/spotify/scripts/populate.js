import { query } from '../../db/db.js'
import { fetchSpotifyData } from '../fetchData.js'

const saveData = async () => {
  const { artists, albums, tracks } = await fetchSpotifyData()

  for (const artist of artists) {
    await query(
      `INSERT IGNORE INTO Artista (ID_Artista, nombre, seguidores, genero, popularidad, url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [artist.id, artist.name, artist.followers?.total || 0, artist.genres?.[0] || null, artist.popularity || 0, artist.external_urls?.spotify || null]
    )
  }

  for (const album of albums) {
    await query(
      `INSERT IGNORE INTO Album (ID_Album, titulo, ano, tipo, total_canciones, url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [album.id, album.name, album.release_date?.slice(0, 4), album.album_type, album.total_tracks || 0, album.external_urls?.spotify || null]
    )

    // Relación album-artista
    for (const a of album.artists) {
      await query(
        `INSERT IGNORE INTO Album_artista (ID_Album, ID_Artista) VALUES (?, ?)`,
        [album.id, a.id]
      )
    }
  }

  for (const track of tracks) {
    await query(
      `INSERT IGNORE INTO Cancion (ID_Cancion, ID_Album, titulo, duracion, url, popularidad)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [track.id, track.album.id, track.name, Math.floor(track.duration_ms / 1000), track.external_urls?.spotify || null, track.popularity || 0]
    )

    // Relación canción-artista
    for (const a of track.artists) {
      await query(
        `INSERT IGNORE INTO Cancion_artista (ID_Cancion, ID_Artista) VALUES (?, ?)`,
        [track.id, a.id]
      )
    }
  }

  console.log('Datos insertados correctamente ✅')
}

saveData()
