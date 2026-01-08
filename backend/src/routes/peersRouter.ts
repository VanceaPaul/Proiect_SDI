import { Router } from 'express';
import { PeerRegistry } from '../services/peerRegistry';

export const createPeersRouter = (registry: PeerRegistry) => {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json({ peers: registry.list() });
  });
  return router;
};
