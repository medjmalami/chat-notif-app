import { Context } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { chatMembers, chats } from "../../db/schema";
export const authController = async (c : Context) => {
    const accessToken = getCookie(c, 'accessToken');
    const refreshToken = getCookie(c, 'refreshToken');

    try {
        if (accessToken && refreshToken) {
            const accessTokenPayload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as jwt.JwtPayload;
            const refreshTokenPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as jwt.JwtPayload;
            if (accessTokenPayload.id !== refreshTokenPayload.id) {
                deleteCookie(c, 'accessToken');
                deleteCookie(c, 'refreshToken');
                return c.json({ message: "Unauthorized" }, 401);
            }
            const userChats = await db
                                    .select({
                                      id: chats.id,
                                      type: chats.type,
                                      name: chats.name,
                                    })
                                    .from(chats)
                                    .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
                                    .where(eq(chatMembers.userId, accessTokenPayload.id))

            return c.json({
                userId: accessTokenPayload.id,
                username: accessTokenPayload.username,
            });
        
        }else{
            return c.json({ message: "Unauthorized" }, 401);
        }
        
    } catch (error) {
        return c.json({ message: "Unauthorized" }, 401);
        
    }
};