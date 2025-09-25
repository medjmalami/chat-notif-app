import { Context } from "hono";
import { z } from "zod";
import { chatMembers, chats, userSessions, users } from "../../db/schema";
import  jwt  from "jsonwebtoken";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import  bcrypt  from 'bcrypt';
import { setCookie } from 'hono/cookie'

const reqSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});
interface reqType extends z.infer<typeof reqSchema> {}


export const signinController = async (c : Context) => {
    try {

        const body = await c.req.json();
        const validation = reqSchema.safeParse(body);
        if (!validation.success) {
            return c.json({messages: "Invalid request"}, 400);
        }

        const req : reqType = validation.data;

        const manyUsers = await db.select().from(users).where(eq(users.email, req.email)).limit(1);

        if (!manyUsers.length) {
            return c.json({ message: "Invalid credentials" }, 404);
        }

        const user = manyUsers[0];

        if (user.passwordHash){
            const match = await bcrypt.compare(req.password, user.passwordHash);
            if (!match) {
                return c.json({ message: "Invalid credentials" }, 401);
            }

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

            //i have to return access token, refresh token , user id , username, chats(id, name, type)

            const userChats = await db
                                    .select({
                                      id: chats.id,
                                      type: chats.type,
                                      name: chats.name,
                                    })
                                    .from(chats)
                                    .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
                                    .where(eq(chatMembers.userId, user.id))

            setCookie(c, 'accessToken', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
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

            return c.json({
                userId: user.id,
                username: user.username,
                chats: userChats,
            });
        }
        else{
            return c.json({ message: "Please use google oauth" }, 400);
        }

    } catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }

};