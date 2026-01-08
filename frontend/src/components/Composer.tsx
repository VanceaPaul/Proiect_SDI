import { FormEvent, useState, useEffect } from 'react';
import { PeerDescriptor } from '../types';

interface Props {
  peers: PeerDescriptor[];
  currentPeerId: string;
  onSend: (content: string, receiverId?: string) => Promise<void>;
  activeConversation?: string;
  onSetConversation?: (id?: string) => void;
}

export const Composer = ({ peers, currentPeerId, onSend, activeConversation, onSetConversation }: Props) => {
  const [receiverId, setReceiverId] = useState<string>('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    setSending(true);
    try {
      await onSend(content.trim(), receiverId || undefined);
      setContent('');
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  // Sync receiverId with activeConversation when it changes
  useEffect(() => {
    if (activeConversation) {
      setReceiverId(activeConversation);
    }
  }, [activeConversation]);

  return (
    <form className="card composer" onSubmit={handleSubmit}>
      <select
        value={receiverId}
        onChange={(event) => {
          const val = event.target.value;
          setReceiverId(val);
          if (onSetConversation) {
            onSetConversation(val || undefined);
          }
        }}
      >
        <option value="">Broadcast</option>
        {peers
          .filter((peer) => peer.peerId !== currentPeerId)
          .map((peer) => (
            <option key={peer.peerId} value={peer.peerId}>
              {peer.displayName}
            </option>
          ))}
      </select>
      <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Scrie mesajul" />
      <button type="submit" disabled={sending}>
        Trimite
      </button>
    </form>
  );
};
