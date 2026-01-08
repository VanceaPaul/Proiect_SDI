import { WebSocket } from 'ws';
import { PeerInfo } from '../types';

interface PeerRecord extends PeerInfo {
  socket: WebSocket;
}

export class PeerRegistry {
  private peers = new Map<string, PeerRecord>();

  register(peerId: string, displayName: string, socket: WebSocket): PeerInfo {
    this.peers.set(peerId, { peerId, displayName, socket });
    return { peerId, displayName };
  }

  remove(peerId: string): void {
    this.peers.delete(peerId);
  }

  get(peerId: string): PeerRecord | undefined {
    return this.peers.get(peerId);
  }

  list(): PeerInfo[] {
    return Array.from(this.peers.values()).map(({ peerId, displayName }) => ({
      peerId,
      displayName
    }));
  }

  broadcast(event: unknown, excludePeerId?: string): void {
    const payload = JSON.stringify(event);
    for (const [peerId, peer] of this.peers.entries()) {
      if (peerId === excludePeerId) {
        continue;
      }
      if (peer.socket.readyState === WebSocket.OPEN) {
        peer.socket.send(payload);
      }
    }
  }
}
