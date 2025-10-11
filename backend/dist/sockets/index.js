import { Server } from 'socket.io';
import { initSocketAuth } from './auth';
import { registerChatSocket } from './chatSocket';
import { db } from '../db';
import { userSessions } from '../db/schema';
import { eq, and, lt, isNotNull, inArray } from 'drizzle-orm';
export let io;
export async function cleanupExpiredSessions() {
    try {
        const now = new Date();
        const result = await db.delete(userSessions)
            .where(lt(userSessions.expiresAt, now));
    }
    catch (err) {
        console.error('Error cleaning up sessions:', err);
    }
}
export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.use(initSocketAuth);
    setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
    setInterval(async () => {
        try {
            const sessions = await db.select().from(userSessions)
                .where(isNotNull(userSessions.socketId));
            if (sessions.length === 0)
                return;
            const staleSessionIds = [];
            for (const session of sessions) {
                const socket = io.sockets.sockets.get(session.socketId);
                if (!socket || !socket.connected) {
                    staleSessionIds.push(session.id);
                }
            }
            if (staleSessionIds.length > 0) {
                await db.update(userSessions)
                    .set({ socketId: null, activeChatId: null })
                    .where(inArray(userSessions.id, staleSessionIds));
            }
        }
        catch (err) {
            console.error('❌ Error cleaning up stale socket IDs:', err);
        }
    }, 30 * 60 * 1000);
    io.on('connection', async (socket) => {
        const { userId, refreshToken } = socket.data;
        try {
            await db.update(userSessions).set({ socketId: socket.id })
                .where(and(eq(userSessions.userId, userId), eq(userSessions.refreshToken, refreshToken)));
            registerChatSocket(io, socket);
            socket.on('disconnect', async () => {
                await db.update(userSessions).set({ activeChatId: null, socketId: null })
                    .where(and(eq(userSessions.userId, userId), eq(userSessions.refreshToken, refreshToken)));
            });
        }
        catch (err) {
            socket.disconnect();
        }
    });
    return io;
}
