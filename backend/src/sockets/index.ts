import { Server } from 'socket.io';
import { initSocketAuth } from './auth';
import { registerChatSocket } from './chatSocket';
import { db } from '../db';
import { userSessions, chats, chatMembers } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export let io: Server;

export function initSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL!,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(initSocketAuth); // handle authentication

  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    const { userId, refreshToken } = socket.data;

    try {
      // Save socket ID in DB
      await db.update(userSessions).set({ socketId: socket.id })
        .where(and(eq(userSessions.userId, userId), eq(userSessions.refreshToken, refreshToken)));

      // Join user chats
      const userChats = await db
        .select({ id: chats.id })
        .from(chats)
        .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
        .where(eq(chatMembers.userId, userId));

      userChats.forEach(({ id }) => socket.join(id));

      // Register chat events
      registerChatSocket(io, socket);

      socket.on('disconnect', async () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
        await db.update(userSessions).set({ activeChatId: null, socketId: null })
          .where(and(eq(userSessions.userId, userId), eq(userSessions.refreshToken, refreshToken)));
      });
    } catch (err) {
      console.error('🔥 Socket connection error:', err);
      socket.disconnect();
    }
  });

  return io;
}
