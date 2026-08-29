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

  const searchRes = await axios.get(
    `https://api.spotify.com/v1/search?q=genre:${genre}&type=artist&limit=20`,
    { headers }
  )

  // Filtrar artistas con popularidad y seguidores altos
  const artists = searchRes.data.artists.items.filter(
    a => a.popularity > 30 && a.followers.total > 200000
  )

  allArtists.push(...artists)

  /* Esto es para agregar artistas manualmente */

  /* const seedArtists = [
    '699OTQXzgjhIYAHMy9RyPD',
     
  ]

  for (const id of seedArtists) {
    try {
      const res = await axios.get(`https://api.spotify.com/v1/artists/${id}`, { headers })
      allArtists.push(res.data) 
      console.log(`✅ ${res.data.name} agregado`)
    } catch (err) {
      console.error(`❌ Error con ${id}:`, err.response?.status, err.response?.data?.error?.message)
    }
  } */

  console.log(`✅ ${allArtists.length} artistas filtrados. Iniciando query a spotify API`)

  // 2️⃣ Para cada artista, traer 10 álbumes (modificar query)
  
  for (const artist of allArtists) {
    await delay(300) // evitar rate limit
    const albumsRes = await axios.get(
      `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=10`,
      { headers }
    )

    const albums = albumsRes.data.items
    allAlbums.push(...albums)

    // 3️⃣ Para cada álbum, traer sus canciones
    for (const album of allAlbums) {
      await delay(200)
      const tracksRes = await axios.get(
        `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
        { headers }
      )

      // Agregamos metadatos del álbum a cada track
      const tracks = tracksRes.data.items.map(t => ({
        ...t,
        album: { id: album.id, name: album.name }
      }))

      allTracks.push(...tracks)
    }
  }

  // Filtrado final de álbumes y canciones
  const filteredAlbums = allAlbums.filter(a => !/remix|karaoke|instrumental/i.test(a.name))
  const filteredTracks = allTracks.filter(t => t.name.length > 2)

  return { artists: allArtists, albums: filteredAlbums, tracks: filteredTracks }
}
