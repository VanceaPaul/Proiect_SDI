import { ChatMessage, PeerDescriptor } from '../types';

const base = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export const api = {
  async fetchMessages(limit = 50): Promise<ChatMessage[]> {
    const res = await fetch(`${base}/messages?limit=${limit}`);
    if (!res.ok) {
      throw new Error('Failed to load messages');
    }
    const data = await res.json();
    return data.messages;
  },
  async fetchPeers(): Promise<PeerDescriptor[]> {
    const res = await fetch(`${base}/peers`);
    if (!res.ok) {
      throw new Error('Failed to load peers');
    }
    const data = await res.json();
    return data.peers;
  },
  async postMessage(message: { senderId: string; senderName?: string; content: string; receiverId?: string }): Promise<ChatMessage> {
    const res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    if (!res.ok) {
      throw new Error('Failed to store message');
    }
    const data = await res.json();
    return data.message;
  }
};
