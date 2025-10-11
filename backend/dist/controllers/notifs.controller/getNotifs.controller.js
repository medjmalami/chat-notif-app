import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import { notificationQueue, messages, users } from "../../db/schema";
export const getNotifsController = async (c) => {
    try {
        const user = c.get('user');
        const notifs = await db
            .select({
            id: notificationQueue.id,
            content: messages.content,
            senderUsername: users.username,
            messageCreatedAt: messages.createdAt,
        })
            .from(notificationQueue)
            .innerJoin(messages, eq(notificationQueue.messageId, messages.id))
            .innerJoin(users, eq(messages.senderId, users.id))
            .where(and(eq(notificationQueue.userId, user.id), eq(notificationQueue.isDelivered, false)))
            .orderBy(notificationQueue.createdAt);
        await db
            .update(notificationQueue)
            .set({ isDelivered: true })
            .where(eq(notificationQueue.userId, user.id));
        return c.json(notifs);
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        return c.json({ message: "Internal server error" }, 500);
    }
};
