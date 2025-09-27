import { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { userSessions } from "../../db/schema";
export const refreshTokenController = async( c : Context  ) => {
    const refreshToken = getCookie(c, 'refreshToken');
    if (!refreshToken) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    try {
        const refreshTokenPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as jwt.JwtPayload;
        const dbUser = await db.select().from(userSessions).where(eq(userSessions.refreshToken, refreshToken)).limit(1);
        if (!dbUser.length) {
            deleteCookie(c, 'refreshToken');
            deleteCookie(c, 'accessToken');
            return c.json({ message: "Unauthorized" }, 401);
        }
        const user = dbUser[0];
        if ( user.userId !== refreshTokenPayload.id) {
            deleteCookie(c, 'refreshToken');
            deleteCookie(c, 'accessToken');
            return c.json({ message: "Unauthorized" }, 401);
        }
        const accessToken =  jwt.sign(refreshTokenPayload,process.env.ACCESS_TOKEN_SECRET!,{ expiresIn: '1h' });
        setCookie(c, 'accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 10 * 60 , // 10 minutes in seconds
            path: '/'
          })
          
          // Set refresh token
        setCookie(c, 'refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
          path: '/'
        })

        return c.json({ message: "Token refreshed successfully" }, 200);
        
    } catch (error) {
        deleteCookie(c, 'refreshToken');
        deleteCookie(c, 'accessToken');
        return c.json({ message: "Unauthorized" }, 401);
    }
}