import axios from 'axios'
import { query } from '../../db/db.js'
import getSpotifyToken from '../spotifyAuth.js'

const delay = ms => new Promise(r => setTimeout(r, ms))

const updatePopularity = async () => {
  const token = await getSpotifyToken()
  const headers = { Authorization: `Bearer ${token}` }

  // 1️⃣ Traer todos los IDs desde MySQL
  const rows = await query('SELECT ID_Cancion FROM Cancion')
  const allIds = rows.map(r => r.ID_Cancion)
  console.log(`🎧 ${allIds.length} canciones encontradas en la base.`)

  // 2️⃣ Procesar en batches de 50
  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50)
    const ids = batch.join(',')
    console.log(`📦 Procesando batch ${i / 50 + 1}/${Math.ceil(allIds.length / 50)}...`)

    try {
      const res = await axios.get(`https://api.spotify.com/v1/tracks?ids=${ids}`, { headers })
      const tracks = res.data.tracks

      // 3️⃣ Actualizar cada canción
      for (const t of tracks) {
        if (!t) continue
        await query(
          `UPDATE Cancion
           SET popularidad = ?
           WHERE ID_Cancion = ?`,
          [
            t.popularity ?? 0,
            t.id
          ]
        )
      }

      await delay(400) // prevenir rate limit
    } catch (err) {
      console.error('⚠️ Error en batch:', err.message)
      await delay(2000) // esperar más si falla
    }
  }

  console.log('✅ Popularidad actualizada correctamente!')
}

updatePopularity()
