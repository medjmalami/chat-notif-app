import { Server } from 'socket.io';
import { initSocketAuth } from './auth';
import { registerChatSocket } from './chatSocket';
import { db } from '../db';
import { userSessions, chats, chatMembers } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';

export let io: Server;

export async function cleanupExpiredSessions() {
  try {
    const now = new Date();
    const result = await db.delete(userSessions)
      .where(lt(userSessions.expiresAt, now));

    console.log(`🧹 Cleaned up expired sessions`);
  } catch (err) {
    console.error('Error cleaning up sessions:', err);
  }
}

export function initSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL!,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(initSocketAuth); // handle authentication

  setInterval(cleanupExpiredSessions, 60 * 60 * 1000); //clean sessions every hour

  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    const { userId, refreshToken } = socket.data;

    try {
      // Save socket ID in DB
      await db.update(userSessions).set({ socketId: socket.id })
        .where(and(eq(userSessions.userId, userId), eq(userSessions.refreshToken, refreshToken)));

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
