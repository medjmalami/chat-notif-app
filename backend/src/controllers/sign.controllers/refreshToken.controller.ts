import { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { userSessions } from "../../db/schema";
export const refreshTokenController = async (c: Context) => {
    
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
      
      if (user.userId !== refreshTokenPayload.id) {
        deleteCookie(c, 'refreshToken');
        deleteCookie(c, 'accessToken');
        return c.json({ message: "Unauthorized" }, 401);
      }
      
      const accessToken = jwt.sign(
        {
          id: refreshTokenPayload.id,
          email: refreshTokenPayload.email,
          username: refreshTokenPayload.username
        },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        {
          id: refreshTokenPayload.id,
          email: refreshTokenPayload.email,
          username: refreshTokenPayload.username
        },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: '7d' }
      );
      
      setCookie(c, 'accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 15 * 60,
        path: '/'
      });
      
      setCookie(c, 'refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      });

      await db.update(userSessions).set({ refreshToken: newRefreshToken }).where(eq(userSessions.userId, user.userId));
      
      return c.json({ message: "Token refreshed successfully" }, 200);
      
    } catch (error) {      
      deleteCookie(c, 'refreshToken');
      deleteCookie(c, 'accessToken');
      return c.json({ message: "Unauthorized" }, 401);
    }
  };