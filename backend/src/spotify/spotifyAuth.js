import axios from 'axios'
import qs from 'qs'
import dotenv from 'dotenv'

dotenv.config()

let cachedToken = null
let tokenExpiresAt = 0

const getSpotifyToken = async () => {
  // Reutilizar token si aún es válido (margen de 60 segundos antes de expirar)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  const tokenUrl = 'https://accounts.spotify.com/api/token'
  const data = qs.stringify({ grant_type: 'client_credentials' })

  const headers = {
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const res = await axios.post(tokenUrl, data, { headers })
  cachedToken = res.data.access_token
  const expiresInMs = (res.data.expires_in || 3600) * 1000
  tokenExpiresAt = Date.now() + expiresInMs

  return cachedToken
}

export default getSpotifyToken
