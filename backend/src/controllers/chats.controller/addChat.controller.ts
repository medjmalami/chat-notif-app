import { Context } from "hono";
import { z } from "zod";
import { chats, chatMembers } from "../../db/schema";
import { db } from "../../db";

const reqSchema = z.object({
    name: z.string().min(3),
    type: z.string().min(3),
    chatMembers: z.array(z.uuid()),
});
interface reqType extends z.infer<typeof reqSchema> {}

export const addChatController = async (c : Context) => {
    try {

        const body = await c.req.json();
        const validation = reqSchema.safeParse(body);
        if (!validation.success) {
            return c.json({messages: "Invalid request"}, 400);
        }

        const req : reqType = validation.data;

        const chatId = await db.insert(chats).values({
            name: req.name,
            type: req.type,
        }).returning();

        const chat = chatId[0];

        for (const member of req.chatMembers) {
            await db.insert(chatMembers).values({
                chatId: chat.id,
                userId: member,
            });
        }
        
        return c.json({
            chatId: chat.id,
            name: chat.name,
            type: chat.type,
        });

    } catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};