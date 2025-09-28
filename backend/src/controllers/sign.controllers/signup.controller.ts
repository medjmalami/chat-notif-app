import { Context } from "hono";
import { z } from "zod";
import { users, userSessions } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import  jwt  from "jsonwebtoken";
import { setCookie } from 'hono/cookie'

const reqSchema = z.object({
    email: z.email(),
    username: z.string().min(3),
    password: z.string().min(8),
});
interface reqType extends z.infer<typeof reqSchema> {}

export const signupController = async (c : Context) => {
    try {

        const body = await c.req.json();
        const validation = reqSchema.safeParse(body);
        if (!validation.success) {
            return c.json({messages: "Invalid request"}, 400);
        }

        const req : reqType = validation.data;

        const manyUsers = await db.select().from(users).where(eq(users.email, req.email)).limit(1);

        if (manyUsers.length) {
            return c.json({ message: "User already exists" }, 400);
        }

        const hashedPassword = await bcrypt.hash(req.password, 10);

        const userId = await db.insert(users).values({
            email: req.email,
            username: req.username,
            passwordHash: hashedPassword,
        }).returning();



        const user = userId[0];
        const payload  = {
            id: user.id,
            email: user.email,
            username: user.username,
        };
        const accessToken =  jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET!,{ expiresIn: '1h' });
        const refreshToken =  jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET!,{ expiresIn: '7d' });
        await db.insert(userSessions).values({
            userId: user.id,
            refreshToken,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        });

        setCookie(c, 'accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 10 * 60 , // 10 minutes in seconds
            path: '/'
          })
          
          // Set refresh token
        setCookie(c, 'refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
          path: '/'
        })
        //i have to return access token, refresh token , user id , username, chats(id, name, type)
        return c.json({
            userId: user.id,
            username: user.username,
            chats: [],
        });

    } catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};