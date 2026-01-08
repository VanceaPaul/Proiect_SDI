export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId?: string;
  content: string;
  createdAt: number;
}

export interface PeerDescriptor {
  peerId: string;
  displayName: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
