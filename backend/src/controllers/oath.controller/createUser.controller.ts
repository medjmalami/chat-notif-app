import { Context } from "hono";
import { z } from "zod";
import { users, oauthAccounts } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { setCookie } from 'hono/cookie'
import { getGoogleOAuthTokens, getGoogleUser } from "../../utils/oauth";
import jwt from "jsonwebtoken";
import { userSessions } from "../../db/schema";

const reqSchema = z.object({
    code: z.string(),
});
interface reqType extends z.infer<typeof reqSchema> {}

export const createUserController = async (c : Context) => {
    try {

        const body = await c.req.json();
        const validation = reqSchema.safeParse(body);
        if (!validation.success) {
            return c.json({messages: "Invalid request"}, 400);
        }

        const req : reqType = validation.data;

        const code = req.code;
        console.log('🔵 code:', code);

        const { access_token } = await getGoogleOAuthTokens(code);
        console.log('🔵 access_token:', access_token);
        
        const googleUser = await getGoogleUser(access_token);
        console.log('🔵 googleUser:', googleUser);
        // googleUser = { id, email, name, picture, ... }

        let payload;
    
        const manyUsers = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);
        if (manyUsers.length) {
            const user = manyUsers[0];
            const found = await db.select().from(oauthAccounts).where(eq(oauthAccounts.userId, user.id));
            if (found.length==0){
                await db.insert(oauthAccounts).values({
                    userId: user.id,
                    googleUserId: googleUser.id,
                });
            }
            payload = {
                id: user.id,
                email: user.email,
                username: user.username,
            };
        }else{
            const newUser = await db.insert(users).values({
                email: googleUser.email,
                username: googleUser.name,
            }).returning();
            await db.insert(oauthAccounts).values({
                userId: newUser[0].id,
                googleUserId: googleUser.id,
            });
            payload = {
                id: newUser[0].id,
                email: newUser[0].email,
                username: newUser[0].username,
            };
        }

        const accessToken =  jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET!,{ expiresIn: '15m' });
        const refreshToken =  jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET!,{ expiresIn: '1d' });
    
        await db.insert(userSessions).values({
                        userId: payload.id,
                        refreshToken,
                        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                    });
        
        setCookie(c, 'accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 15 * 60 , 
            path: '/',
          })
          
        setCookie(c, 'refreshToken', refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
          maxAge:  60 * 60 * 24 * 7, 
          path: '/',
        })
    
        return c.json({
            userId: payload.id,
            username: payload.username,
        });
        
      } catch (error) {
        console.log('🔴 Error:', error);
        return c.json({ message: "Internal server error" }, 500);
      }
    };

