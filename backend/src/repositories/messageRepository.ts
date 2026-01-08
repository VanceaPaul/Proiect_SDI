import { v4 as uuid } from 'uuid';
import { readDb, writeDb } from '../db';
import { StoredMessage } from '../types';

export const messageRepository = {
  saveMessage(senderId: string, content: string, receiverId?: string, senderName?: string): StoredMessage {
    const row: StoredMessage = {
      id: uuid(),
      senderId,
      senderName,
      receiverId,
      content,
      createdAt: Date.now()
    };

    writeDb((database) => {
      const stmt = database.prepare(
        'INSERT INTO messages (id, sender_id, sender_name, receiver_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      );
      stmt.run([row.id, row.senderId, row.senderName ?? null, row.receiverId ?? null, row.content, row.createdAt]);
      stmt.free();
    });

    return row;
  },
  latest(limit = 50): StoredMessage[] {
    return readDb((database) => {
      const stmt = database.prepare(
        'SELECT id, sender_id as senderId, sender_name as senderName, receiver_id as receiverId, content, created_at as createdAt FROM messages ORDER BY created_at DESC LIMIT ?'
      );
      stmt.bind([limit]);
      const rows: StoredMessage[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push({
          id: String(row.id),
          senderId: String(row.senderId),
          receiverId: row.receiverId ? String(row.receiverId) : undefined,
          content: String(row.content),
          createdAt: Number(row.createdAt)
        });
      }
      stmt.free();
      return rows;
    });
  }
};
