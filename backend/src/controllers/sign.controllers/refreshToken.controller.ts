import { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
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
      
      c.header(
        'Set-Cookie',
        `accessToken=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${15 * 60}`,
        { append: true }
      )
      
      c.header(
        'Set-Cookie',
        `refreshToken=${newRefreshToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 7}`,
        { append: true }
      )

      await db.delete(userSessions).where(
        and(eq(userSessions.refreshToken, refreshToken), eq(userSessions.userId, user.userId))
      );

      await db.insert(userSessions).values({
        userId: user.userId,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })      
      return c.json({ message: "Token refreshed successfully" }, 200);
      
    } catch (error) {      
      console.log('🔵 error:', error);
      deleteCookie(c, 'refreshToken');
      deleteCookie(c, 'accessToken');
      return c.json({ message: "Unauthorized" }, 401);
    }
  };