dns.setServers(["8.8.8.8", "8.8.4.4"]);
import dns from "node:dns";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import requestRoutes from './routes/request.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import userRoutes from './routes/user.routes.js';
import messageRoutes from './routes/message.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// === CORS ĐÃ SỬA ===
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

// === SOCKET CONFIG ===
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }
});

app.set('io', io); // Share io with controllers

io.on('connection', (socket) => {
  console.log('Tân Socket kết nối:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} vào phòng ${roomId}`);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('Socket ngắt kết nối:', socket.id);
  });
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/announcements', announcementRoutes);

// Phục vụ file static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AcryDesk API running' });
});

const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI as string;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('✅ Kết nối MongoDB thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB:', err);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server + Socket.io đang chạy tại port ${PORT}`);
  });
};

startServer();