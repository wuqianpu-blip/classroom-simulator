import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from './config';
import { authRouter } from './routes/auth';
import { roomRouter } from './routes/rooms';
import { setupSocketHandlers } from './socket';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

setupSocketHandlers(io);

httpServer.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
