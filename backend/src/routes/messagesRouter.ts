import { Router } from 'express';
import { messageService } from '../services/messageService';

export const messagesRouter = Router();

messagesRouter.get('/', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  res.json({ messages: messageService.history(limit) });
});

messagesRouter.post('/', (req, res, next) => {
  try {
    const message = messageService.create({
      senderId: req.body.senderId,
      receiverId: req.body.receiverId,
      content: req.body.content
    });
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});
