import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { userSessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { parse as parseCookie } from 'cookie';

interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

export async function initSocketAuth(socket: Socket, next: (err?: any) => void) {
  try {
    const cookies = parseCookie(socket.handshake.headers.cookie || '');
    const accessToken = cookies.accessToken;
    const refreshToken = cookies.refreshToken;

    if (!accessToken || !refreshToken) {
      return next(new Error('Tokens missing'));
    }

    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;

    const session = await db.select({
      id: userSessions.id,
      expiresAt: userSessions.expiresAt,
      userId: userSessions.userId,
    })
      .from(userSessions)
      .where(and(eq(userSessions.userId, payload.id), eq(userSessions.refreshToken, refreshToken)))
      .limit(1);

    if (!session.length) return next(new Error('Invalid session'));

    socket.data.userId = payload.id;
    socket.data.username = payload.username;
    socket.data.email = payload.email;
    socket.data.refreshToken = refreshToken;

    next();
  } catch (err : any) {
    if (err.name === 'TokenExpiredError') {
        socket.emit('error', {
          message: 'Session expired',
        });
    }
      console.error('Socket authentication error:', err);
     
    next(new Error('Authentication failed'));
  }
}
