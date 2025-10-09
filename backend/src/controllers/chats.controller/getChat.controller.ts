import { Context } from "hono";
import { db } from "../../db";
import { messages, users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const getChatController = async (c: Context) => {
  try {
    const chatId = c.req.param("chatId");

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
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
};
