export type SignalMessage =
  | {
      action: 'hello';
      peerId: string;
      displayName: string;
    }
  | {
      action: 'signal';
      from: string;
      to: string;
      data: unknown;
    }
  | {
      action: 'message';
      from: string;
      to?: string;
      content: string;
    }
  | {
      action: 'peers';
    };

export interface StoredMessage {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId?: string;
  content: string;
  createdAt: number;
}

export interface PeerInfo {
  peerId: string;
  displayName: string;
}
