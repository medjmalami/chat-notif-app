import { db } from "../../db";
import { messages, users, chatMembers } from "../../db/schema";
import { eq, and } from "drizzle-orm";
export const getChatController = async (c) => {
    try {
        const chatId = c.req.param("chatId");
        const user = c.get('user');
        const member = await db.select({
            chatId: chatMembers.chatId,
            userId: chatMembers.userId,
        }).from(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, user.id)));
        if (!member.length) {
            return c.json({ message: "Unauthorized" }, 401);
        }
        const Messages = await db
            .select({
            id: messages.id,
            content: messages.content,
            senderID: messages.senderId,
            createdAt: messages.createdAt,
            senderName: users.username,
        })
            .from(messages)
            .innerJoin(users, eq(messages.senderId, users.id))
            .where(eq(messages.chatId, chatId))
            .orderBy(messages.createdAt);
        return c.json(Messages);
    }
    catch (error) {
        console.error(error);
        return c.json({ message: "Internal server error" }, 500);
    }
};
