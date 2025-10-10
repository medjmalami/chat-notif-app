import { Server, Socket } from 'socket.io';
import { db } from '../db';
import { eq, and, inArray } from 'drizzle-orm';
import { userSessions, chatMembers, messages, notificationQueue } from '../db/schema';

export function registerChatSocket(io: Server, socket: Socket) {
  const { userId, refreshToken, username } = socket.data;

  socket.on('chatID', async (chatId: string) => {
    try {
      const membership = await db.select().from(chatMembers)
        .where(and(eq(chatMembers.userId, userId), eq(chatMembers.chatId, chatId)))
        .limit(1);

      if (!membership.length) return console.warn(`⚠️ User ${userId} not a member of chat ${chatId}`);

      await db.update(userSessions).set({ activeChatId: chatId })
        .where(and(eq(userSessions.userId, userId), eq(userSessions.refreshToken, refreshToken)));

    } catch (err) {
      console.error('Error setting active chat:', err);
    }
  });

  socket.on('send_message', async ({ chatId, content }: { chatId: string; content: string }) => {
    try {
      if (!content?.trim() || content.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }
  
      if (content.length > 5000) {
        socket.emit('error', { message: 'Message too long' });
        return;
      }
  
      if (!chatId || typeof chatId !== 'string') {
        socket.emit('error', { message: 'Invalid chat ID' });
        return;
      }
  
      const membership = await db.select().from(chatMembers)
        .where(and(eq(chatMembers.userId, userId), eq(chatMembers.chatId, chatId)))
        .limit(1);
  
      if (!membership.length) {
        socket.emit('error', { message: 'You are not a member of this chat' });
        return;
      }
  
      const [newMessage] = await db.insert(messages)
        .values({ chatId, senderId: userId, content })
        .returning();

      const chatMembersList = await db.select().from(chatMembers)
        .where(eq(chatMembers.chatId, chatId));
  
      const memberUserIds = chatMembersList
        .map(m => m.userId)
        .filter(id => id !== userId);
  
      const allSessions = await db.select().from(userSessions)
        .where(inArray(userSessions.userId, memberUserIds));
  
      const sessionsByUserId = new Map<string, typeof allSessions>();
      for (const session of allSessions) {
        if (!sessionsByUserId.has(session.userId)) {
          sessionsByUserId.set(session.userId, []);
        }
        sessionsByUserId.get(session.userId)!.push(session);
      }
  
      const offlineNotifications: typeof notificationQueue.$inferInsert[] = [];
  
      for (const member of chatMembersList) {
        if (member.userId === userId) continue;

        const memberSessions = sessionsByUserId.get(member.userId) || [];
  
        if (memberSessions.length === 0) {
          offlineNotifications.push({
            userId: member.userId,
            chatId,
            messageId: newMessage.id,
          });
          continue;
        }

        const connectedSockets = memberSessions
          .filter(session => session.socketId)
          .map(session => {
            const sock = io.sockets.sockets.get(session.socketId!);
            return sock && sock.connected ? { socket: sock, session } : null;
          })
          .filter(Boolean) as { socket: Socket; session: typeof allSessions[0] }[];

        if (connectedSockets.length === 0) {
          offlineNotifications.push({
            userId: member.userId,
            chatId,
            messageId: newMessage.id,
          });
          continue;
        }

        for (const { socket: targetSocket, session } of connectedSockets) {
          const isActiveChat = session.activeChatId === chatId;
          targetSocket.emit(isActiveChat ? 'new_message' : 'notification', {
            id: newMessage.id,
            chatId: newMessage.chatId,
            senderId: newMessage.senderId,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            senderName: username,
            isActiveChat,
          });
        }
      }
  
      if (offlineNotifications.length > 0) {
        await db.insert(notificationQueue).values(offlineNotifications);
      }
  
    } catch (err) {
      console.error('Error sending message:', err);
      socket.emit('error', {
        message: 'Failed to send message',
      });
    }
  });
}