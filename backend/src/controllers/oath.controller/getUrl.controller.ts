import { Context } from "hono";
import { OAuth2Client } from 'google-auth-library';

export const getUrl = (c : Context) => {
    const googleClient = new OAuth2Client(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        `${process.env.FRONTEND_URL}/auth/callback`
      )
    const authUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
      })
      
      return c.json({ url: authUrl })
}