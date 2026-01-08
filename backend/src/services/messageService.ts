import { z } from 'zod';
import { messageRepository } from '../repositories/messageRepository';
import { StoredMessage } from '../types';

const messageSchema = z.object({
  senderId: z.string().min(3),
  senderName: z.string().min(1).optional(),
  content: z.string().min(1).max(2_048),
  receiverId: z.string().min(3).optional()
});

export const messageService = {
  create(input: z.infer<typeof messageSchema>): StoredMessage {
    const data = messageSchema.parse(input);
    return messageRepository.saveMessage(data.senderId, data.content, data.receiverId, data.senderName);
  },
  history(limit?: number): StoredMessage[] {
    return messageRepository.latest(limit ?? 50);
  }
};
