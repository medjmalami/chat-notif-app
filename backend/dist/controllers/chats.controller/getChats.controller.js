import { db } from "../../db";
import { chatMembers, chats } from "../../db/schema";
import { eq } from "drizzle-orm";
export const getChatsController = async (c) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    try {
        const userChats = await db
            .select({
            id: chats.id,
            type: chats.type,
            name: chats.name,
        })
            .from(chats)
            .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
            .where(eq(chatMembers.userId, user.id));
        return c.json(userChats);
    }
    catch (error) {
        return c.json({ message: "Internal server error" }, 500);
    }
};
