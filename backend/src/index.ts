import cors from 'cors';
import express from 'express';
import http from 'http';
import { config } from './config';
import { initDb } from './db';
import { messagesRouter } from './routes/messagesRouter';
import { createPeersRouter } from './routes/peersRouter';
import { setupSignalingGateway } from './signalingGateway';
import { PeerRegistry } from './services/peerRegistry';

const app = express();
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true
  })
);
app.use(express.json());

const peerRegistry = new PeerRegistry();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/messages', messagesRouter);
app.use('/api/peers', createPeersRouter(peerRegistry));

const server = http.createServer(app);
setupSignalingGateway(server, peerRegistry);

const ready = initDb()
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      server.listen(config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Signaling service listening on :${config.port}`);
      });
    }
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database', error);
    process.exit(1);
  });

export { app, server, ready };
