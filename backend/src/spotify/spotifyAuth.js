import axios from 'axios'
import qs from 'qs'
import dotenv from 'dotenv'

dotenv.config()

const getSpotifyToken = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  const tokenUrl = 'https://accounts.spotify.com/api/token'
  const data = qs.stringify({ grant_type: 'client_credentials' })

  const headers = {
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const res = await axios.post(tokenUrl, data, { headers })
  return res.data.access_token
}

export default getSpotifyToken
