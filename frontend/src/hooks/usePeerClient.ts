import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { ChatMessage, ConnectionStatus, PeerDescriptor } from '../types';

interface Options {
  displayName: string;
  enabled: boolean;
}

interface PeerClientHook {
  peerId: string;
  peers: PeerDescriptor[];
  messages: ChatMessage[];
  status: ConnectionStatus;
  error?: string;
  connectToPeer: (peerId: string) => Promise<void>;
  sendMessage: (content: string, receiverId?: string) => Promise<void>;
  refreshPeers: () => Promise<void>;
}

type SignalEnvelope = {
  type: 'signal';
  from: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

type WelcomeEnvelope = {
  type: 'welcome';
  peer: PeerDescriptor;
  peers: PeerDescriptor[];
  turn: { url?: string; username?: string; credential?: string };
};

type MessageEnvelope = {
  type: 'message' | 'message-ack';
  message: ChatMessage;
};

type PeerEvent =
  | { type: 'peer-joined'; peer: PeerDescriptor }
  | { type: 'peer-left'; peerId: string };

const defaultIceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

export const usePeerClient = ({ displayName, enabled }: Options): PeerClientHook => {
  const [peers, setPeers] = useState<PeerDescriptor[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string>();
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const dataChannels = useRef(new Map<string, RTCDataChannel>());
  const turnConfig = useRef<{ url?: string; username?: string; credential?: string } | null>(null);
  const pendingCandidates = useRef(new Map<string, RTCIceCandidateInit[]>());

  const peerId = useMemo(() => crypto.randomUUID(), []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, message].sort((a, b) => a.createdAt - b.createdAt);
    });
  }, []);

  const hydrateHistory = useCallback(async () => {
    try {
      const [history, peerList] = await Promise.all([api.fetchMessages(), api.fetchPeers()]);
      setMessages(history.sort((a, b) => a.createdAt - b.createdAt));
      setPeers(peerList);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, []);

  const ensurePeerConnection = useCallback(
    (targetPeerId: string) => {
      let pc = peerConnections.current.get(targetPeerId);
      if (pc) {
        return pc;
      }
      const iceServers: RTCIceServer[] = turnConfig.current?.url
        ? [
            {
              urls: turnConfig.current.url,
              username: turnConfig.current.username,
              credential: turnConfig.current.credential
            }
          ]
        : defaultIceServers;

      pc = new RTCPeerConnection({ iceServers });
      peerConnections.current.set(targetPeerId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.send(
            JSON.stringify({
              action: 'signal',
              from: peerId,
              to: targetPeerId,
              data: event.candidate
            })
          );
        }
      };

      pc.ondatachannel = (event) => {
        const channel = event.channel;
        dataChannels.current.set(targetPeerId, channel);
        channel.onmessage = (msg) => {
          const parsed = JSON.parse(msg.data) as ChatMessage;
          addMessage(parsed);
        };
        channel.onopen = () => setStatus('connected');
        channel.onclose = () => {
          setStatus('disconnected');
          dataChannels.current.delete(targetPeerId);
        };
      };

      pc.onconnectionstatechange = () => {
        if (pc?.connectionState === 'failed') {
          setStatus('error');
        }
      };

      const bufferedCandidates = pendingCandidates.current.get(targetPeerId);
      if (bufferedCandidates?.length) {
        bufferedCandidates.forEach((candidate) => pc?.addIceCandidate(candidate));
        pendingCandidates.current.delete(targetPeerId);
      }

      return pc;
    },
    [addMessage, peerId, displayName]
  );

  const connectToPeer = useCallback(
    async (targetPeerId: string) => {
      setStatus('connecting');
      const pc = ensurePeerConnection(targetPeerId);
      const channel = pc.createDataChannel('chat');
      dataChannels.current.set(targetPeerId, channel);
      channel.onopen = () => setStatus('connected');
      channel.onmessage = (event) => addMessage(JSON.parse(event.data));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.send(
        JSON.stringify({
          action: 'signal',
          from: peerId,
          to: targetPeerId,
          data: offer
        })
      );
    },
    [addMessage, ensurePeerConnection, peerId]
  );

  const sendMessage = useCallback(
    async (content: string, receiverId?: string) => {
      const payload: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: peerId,
        senderName: displayName,
        receiverId,
        content,
        createdAt: Date.now()
      };

      if (receiverId) {
        const channel = dataChannels.current.get(receiverId);
        if (channel?.readyState === 'open') {
          channel.send(JSON.stringify(payload));
        } else {
          throw new Error('Peer data channel is not ready');
        }
      } else {
        dataChannels.current.forEach((channel) => {
          if (channel.readyState === 'open') {
            channel.send(JSON.stringify(payload));
          }
        });
      }

      addMessage(payload);
      await api.postMessage({ senderId: peerId, senderName: displayName, receiverId, content });
    },
    [addMessage, peerId]
  );

  const handleSignal = useCallback(
    async (signal: SignalEnvelope) => {
      const { from, data } = signal;
      const pc = ensurePeerConnection(from);
      if ('type' in data && data.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.send(
          JSON.stringify({
            action: 'signal',
            from: peerId,
            to: from,
            data: answer
          })
        );
      } else if ('type' in data && data.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if ('candidate' in data) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        } else {
          const list = pendingCandidates.current.get(from) ?? [];
          list.push(data);
          pendingCandidates.current.set(from, list);
        }
      }
    },
    [ensurePeerConnection, peerId]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setStatus('connecting');
    setError(undefined);

    const signalingUrl = (import.meta.env.VITE_SIGNALING_URL as string) || 'ws://localhost:4000/ws';
    const apiKey = (import.meta.env.VITE_SIGNALING_API_KEY as string) || 'dev-api-key';
    const ws = new WebSocket(`${signalingUrl}?apiKey=${apiKey}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      ws.send(
        JSON.stringify({
          action: 'hello',
          peerId,
          displayName
        })
      );
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data) as
        | WelcomeEnvelope
        | SignalEnvelope
        | MessageEnvelope
        | PeerEvent
        | { type: 'error'; reason: string };

      if (payload.type === 'welcome') {
        turnConfig.current = payload.turn;
        setPeers(payload.peers);
        hydrateHistory();
        return;
      }
      if (payload.type === 'signal') {
        void handleSignal(payload);
        return;
      }
      if (payload.type === 'message' || payload.type === 'message-ack') {
        addMessage(payload.message);
        return;
      }
      if (payload.type === 'peer-joined') {
        setPeers((prev) => {
          const exists = prev.some((p) => p.peerId === payload.peer.peerId);
          return exists ? prev : [...prev, payload.peer];
        });
        return;
      }
      if (payload.type === 'peer-left') {
        setPeers((prev) => prev.filter((p) => p.peerId !== payload.peerId));
        peerConnections.current.delete(payload.peerId);
        dataChannels.current.delete(payload.peerId);
        return;
      }
      if ('reason' in payload) {
        setError(payload.reason);
        setStatus('error');
      }
    };

    ws.onerror = () => {
      setError('Signaling connection failed');
      setStatus('error');
    };

    ws.onclose = () => {
      setStatus('disconnected');
    };

    return () => {
      ws.close();
      peerConnections.current.forEach((pc) => pc.close());
      dataChannels.current.forEach((ch) => ch.close());
      peerConnections.current.clear();
      dataChannels.current.clear();
    };
  }, [addMessage, displayName, enabled, handleSignal, hydrateHistory, peerId]);

  return {
    peerId,
    peers,
    messages,
    status,
    error,
    connectToPeer,
    sendMessage,
    refreshPeers: hydrateHistory
  };
};
