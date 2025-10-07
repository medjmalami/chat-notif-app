import { Server } from 'socket.io';
import { registerChatSocket } from './chatSocket';

export let io: Server;

export function initSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL!,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    registerChatSocket(io, socket);
  });

  return io;
}
