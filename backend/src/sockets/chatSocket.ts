import { Server, Socket } from 'socket.io';

export function registerChatSocket(io: Server, socket: Socket) {
  socket.on('join_chat', (chatId: string) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on('send_message', (data: { chatId: string; message: string; senderId: string }) => {
    const { chatId, message, senderId } = data;
    io.to(chatId).emit('new_message', { chatId, message, senderId });
  });

  socket.on('disconnect', (reason: string) => {
    console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
    // optional: emit 'user_offline' event here if needed
  });
}
