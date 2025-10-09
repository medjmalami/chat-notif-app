import { Server, Socket } from 'socket.io';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { userSessions, chatMembers, messages } from '../db/schema';

export function registerChatSocket(io: Server, socket: Socket) {
  const { userId, refreshToken } = socket.data;

  // Set active chat
  socket.on('chatID', async (chatId: string) => {
    try {
      const membership = await db.select().from(chatMembers)
        .where(and(eq(chatMembers.userId, userId), eq(chatMembers.chatId, chatId)))
        .limit(1);

      if (!membership.length) return console.warn(`⚠️ User ${userId} not a member of chat ${chatId}`);

      await db.update(userSessions).set({ activeChatId: chatId })
        .where(and(eq(userSessions.userId, userId), eq(userSessions.refreshToken, refreshToken)));

      console.log(`✅ User ${userId} set active chat: ${chatId}`);
    } catch (err) {
      console.error('Error setting active chat:', err);
    }
  });

  // Send message
  socket.on('send_message', async ({ chatId, content }: { chatId: string; content: string }) => {
    try {
      const membership = await db.select().from(chatMembers)
        .where(and(eq(chatMembers.userId, userId), eq(chatMembers.chatId, chatId)))
        .limit(1);

      if (!membership.length) {
        socket.emit('error', { message: 'You are not a member of this chat' });
        return;
      }

      const [newMessage] = await db.insert(messages).values({ chatId, senderId: userId, content }).returning();

      io.to(chatId).emit('new_message', {
        id: newMessage.id,
        chatId: newMessage.chatId,
        senderId: userId,
        senderUsername: socket.data.username,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
      });

      console.log(`📤 Message sent by ${socket.data.username} to chat ${chatId}`);
    } catch (err) {
      console.error('Error sending message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
}
