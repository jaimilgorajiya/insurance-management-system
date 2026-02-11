
import { Server } from 'socket.io';

let io;

export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        socket.on('join_ticket', (ticketId) => {
            socket.join(`ticket_${ticketId}`);
            console.log(`User ${socket.id} joined ticket_${ticketId}`);
        });

        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${socket.id} joined user_${userId}`);
        });

        socket.on('leave_ticket', (ticketId) => {
            socket.leave(`ticket_${ticketId}`);
            console.log(`User ${socket.id} left ticket_${ticketId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
