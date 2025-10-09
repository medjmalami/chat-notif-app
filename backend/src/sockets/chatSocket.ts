import { Server, Socket } from 'socket.io';
import { db } from '../db';
import { eq, and, inArray } from 'drizzle-orm';
import { userSessions, chatMembers, messages, notificationQueue } from '../db/schema';

export function registerChatSocket(io: Server, socket: Socket) {
  const { userId, refreshToken, username } = socket.data;

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
  
      // Verify sender is a member of the chat
      const membership = await db.select().from(chatMembers)
        .where(and(eq(chatMembers.userId, userId), eq(chatMembers.chatId, chatId)))
        .limit(1);
  
      if (!membership.length) {
        socket.emit('error', { message: 'You are not a member of this chat' });
        return;
      }
  
      // Insert message
      const [newMessage] = await db.insert(messages)
        .values({ chatId, senderId: userId, content })
        .returning();

      const chatMembersList = await db.select().from(chatMembers)
        .where(eq(chatMembers.chatId, chatId));
  
      // Collect all user IDs (excluding sender)
      const memberUserIds = chatMembersList
        .map(m => m.userId)
        .filter(id => id !== userId);
  
      // Single query for all sessions
      const allSessions = await db.select().from(userSessions)
        .where(inArray(userSessions.userId, memberUserIds));
  
      // Map sessions by user ID
      const sessionsByUserId = new Map<string, typeof allSessions>();
      for (const session of allSessions) {
        if (!sessionsByUserId.has(session.userId)) {
          sessionsByUserId.set(session.userId, []);
        }
        sessionsByUserId.get(session.userId)!.push(session);
      }
  
      // Prepare offline notifications batch
      const offlineNotifications: typeof notificationQueue.$inferInsert[] = [];
  
      // Process each member (excluding sender)
      for (const member of chatMembersList) {
        // Skip the sender
        if (member.userId === userId) continue;

        const memberSessions = sessionsByUserId.get(member.userId) || [];
  
        // Case 1: No sessions exist - user is completely offline
        if (memberSessions.length === 0) {
          offlineNotifications.push({
            userId: member.userId,
            chatId,
            messageId: newMessage.id,
          });
          continue;
        }

        // Case 2 & 3: Sessions exist - check if any have active socket connections
        const connectedSockets = memberSessions
          .filter(session => session.socketId)
          .map(session => {
            const sock = io.sockets.sockets.get(session.socketId!);
            return sock && sock.connected ? { socket: sock, session } : null;
          })
          .filter(Boolean) as { socket: Socket; session: typeof allSessions[0] }[];

        // Case 2: Sessions exist but NO active socket connections
        if (connectedSockets.length === 0) {
          offlineNotifications.push({
            userId: member.userId,
            chatId,
            messageId: newMessage.id,
          });
          continue;
        }

        // Case 3: At least one active socket connection exists - deliver in real-time
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
  
      // Batch insert all offline notifications at once
      if (offlineNotifications.length > 0) {
        await db.insert(notificationQueue).values(offlineNotifications);
      }
  
      console.log(`📤 Message sent by ${username} to chat ${chatId} - ${offlineNotifications.length} offline notification(s)`);
    } catch (err) {
      console.error('Error sending message:', err);
      socket.emit('error', {
        message: 'Failed to send message',
      });
    }
  });
}