import axios from 'axios'
import getSpotifyToken from './spotifyAuth.js'

// Delay entre requests para no superar rate limit
const delay = ms => new Promise(r => setTimeout(r, ms))

export const fetchSpotifyData = async (genre = 'rock') => {
  const token = await getSpotifyToken()
  const headers = { Authorization: `Bearer ${token}` }

  const allArtists = []
  const allAlbums = []
  const allTracks = []

  console.log(`🎧 Buscando artistas populares de ${genre}...`)

  // 1️⃣ Buscar artistas populares del genero
  // al poner zaraza en el genre devuelve array vacio, conveniente para inserciones manuales

  // 1️⃣ Buscar artistas populares del género usando query params codificados
  const searchRes = await axios.get('https://api.spotify.com/v1/search', {
    headers,
    params: {
      q: `genre:${genre}`,
      type: 'artist',
      limit: 10,
    },
  })

  // Filtrar artistas con popularidad y seguidores altos
  const rawArtists = searchRes.data?.artists?.items || []
  const artists = rawArtists.filter(
    a => a.popularity > 20 && (a.followers?.total || 0) > 50000
  )

  allArtists.push(...artists.length > 0 ? artists : rawArtists)

  console.log(`✅ ${allArtists.length} artistas encontrados. Obteniendo álbumes y canciones...`)

  // 2️⃣ Para cada artista, traer sus álbumes
  for (const artist of allArtists) {
    await delay(300) // evitar rate limit
    try {
      const albumsRes = await axios.get(
        `https://api.spotify.com/v1/artists/${artist.id}/albums`,
        {
          headers,
          params: {
            include_groups: 'album,single',
            limit: 5,
          },
        }
      )

      const albums = albumsRes.data?.items || []
      allAlbums.push(...albums)

      // 3️⃣ Para cada álbum de ESTE artista, traer sus canciones
      for (const album of albums) {
        await delay(200)
        try {
          const tracksRes = await axios.get(
            `https://api.spotify.com/v1/albums/${album.id}/tracks`,
            {
              headers,
              params: {
                limit: 20,
              },
            }
          )

          const albumTracks = (tracksRes.data?.items || []).map(t => ({
            ...t,
            album: { id: album.id, name: album.name },
          }))

          allTracks.push(...albumTracks)
        } catch (err) {
          console.warn(`Aviso: Error obteniendo canciones de ${album.name}:`, err.response?.data?.error?.message || err.message)
        }
      }
    } catch (err) {
      console.warn(`Aviso: Error obteniendo álbumes de ${artist.name}:`, err.response?.data?.error?.message || err.message)
    }
  }

  // Filtrado final de álbumes y canciones
  const filteredAlbums = allAlbums.filter(a => !/remix|karaoke|instrumental/i.test(a.name))
  const filteredTracks = allTracks.filter(t => (t.name || '').length > 1)

  return { artists: allArtists, albums: filteredAlbums, tracks: filteredTracks }
}
