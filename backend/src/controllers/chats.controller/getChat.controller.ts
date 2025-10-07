import { Context } from "hono";
import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";
export const getChatController = async (c : Context) => {
    try {
        const chatId = c.req.param("chatId");
        const Messages = await db.select({id: messages.id, content: messages.content, senderId: messages.senderId, createdAt: messages.createdAt}).from(messages).where(eq(messages.chatId, chatId));
        return c.json(Messages);

    } catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
}