import { Context } from "hono";
import { z } from "zod";
import { chats, chatMembers } from "../../db/schema";
import { db } from "../../db";

const reqSchema = z.object({
    name: z.string().min(3),
    type: z.string().min(3),
    chatMembers: z.array(z.string()).optional().default([]),
});
type ReqType = z.infer<typeof reqSchema>;

export const addChatController = async (c: Context) => {
    try {
        const body = await c.req.json();
        const validation = reqSchema.safeParse(body);

        if (!validation.success) {
            return c.json({ message: "Invalid request" }, 400);
        }

        const user = c.get("user");
        if (!user) {
            return c.json({ message: "Unauthorized" }, 401);
        }

        const req: ReqType = validation.data;

        const [chat] = await db
            .insert(chats)
            .values({
                name: req.name,
                type: req.type,
            })
            .returning();

        const uniqueMembers = Array.from(new Set([...req.chatMembers, user.id]));

        for (const member of uniqueMembers) {
            await db.insert(chatMembers).values({
                chatId: chat.id,
                userId: member,
            });
        }

        return c.json({
            chatId: chat.id,
            name: chat.name,
            type: chat.type,
            members: uniqueMembers,
        });
    } catch (error) {
        console.error(error);
        return c.json({ message: "Internal server error" }, 500);
    }
};
