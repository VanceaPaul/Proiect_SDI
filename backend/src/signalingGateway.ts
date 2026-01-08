import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { config } from './config';
import { messageService } from './services/messageService';
import { PeerRegistry } from './services/peerRegistry';
import { SignalMessage } from './types';

const safeSend = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const rejectUnauthorized = (socket: WebSocket, reason: string) => {
  safeSend(socket, { type: 'error', reason });
  socket.close(1008, reason);
};

export const setupSignalingGateway = (server: Server, registry: PeerRegistry) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url || '', 'http://localhost');
    const apiKey = url.searchParams.get('apiKey') || request.headers['x-api-key'];
    if (apiKey !== config.apiKey) {
      rejectUnauthorized(socket, 'Invalid API key');
      return;
    }

    let currentPeerId: string | null = null;

    socket.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString()) as SignalMessage;
        if (payload.action === 'hello') {
          currentPeerId = payload.peerId;
          const peer = registry.register(payload.peerId, payload.displayName, socket);
          safeSend(socket, {
            type: 'welcome',
            peer,
            peers: registry.list(),
            turn: config.turn
          });
          registry.broadcast({ type: 'peer-joined', peer }, peer.peerId);
          return;
        }

        if (!currentPeerId) {
          rejectUnauthorized(socket, 'Handshake required');
          return;
        }

        if (payload.action === 'peers') {
          safeSend(socket, { type: 'peers', peers: registry.list() });
          return;
        }

        if (payload.action === 'signal') {
          const target = registry.get(payload.to);
          if (target) {
            safeSend(target.socket, {
              type: 'signal',
              from: currentPeerId,
              data: payload.data
            });
          }
          return;
        }

        if (payload.action === 'message') {
          const senderInfo = registry.get(currentPeerId);
          const stored = messageService.create({
            senderId: currentPeerId,
            senderName: senderInfo?.displayName,
            receiverId: payload.to,
            content: payload.content
          });
          if (payload.to) {
            const target = registry.get(payload.to);
            if (target) {
              safeSend(target.socket, {
                type: 'message',
                message: stored
              });
            }
          } else {
            registry.broadcast({ type: 'message', message: stored }, currentPeerId);
          }
          safeSend(socket, { type: 'message-ack', message: stored });
          return;
        }
      } catch (error) {
        safeSend(socket, { type: 'error', reason: (error as Error).message });
      }
    });

    socket.on('close', () => {
      if (currentPeerId) {
        registry.remove(currentPeerId);
        registry.broadcast({ type: 'peer-left', peerId: currentPeerId });
      }
    });
  });

  return wss;
};
