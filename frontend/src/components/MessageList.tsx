import { ChatMessage, PeerDescriptor } from '../types';

interface Props {
  messages: ChatMessage[];
  peers: PeerDescriptor[];
  currentPeerId: string;
  activeConversation?: string;
}
export const MessageList = ({ messages, peers, currentPeerId, activeConversation }: Props) => {
  const visibleMessages = activeConversation
    ? messages.filter(
        (m) => (m.senderId === currentPeerId && m.receiverId === activeConversation) || (m.senderId === activeConversation && m.receiverId === currentPeerId)
      )
    : messages.filter((m) => !m.receiverId);

  return (
    <div className="card message-list">
      {visibleMessages.length === 0 && <p>Niciun mesaj încă.</p>}
      {visibleMessages.map((message) => {
        // Prefer the current active peer displayName so name changes reflect immediately.
        const activeSender = peers.find((p) => p.peerId === message.senderId);
        const senderName = message.senderId === currentPeerId ? 'Tu' : activeSender?.displayName ?? message.senderName ?? message.senderId;

        const activeReceiver = message.receiverId ? peers.find((p) => p.peerId === message.receiverId) : undefined;
        const receiverName = activeReceiver ? activeReceiver.displayName : message.receiverId;

        return (
          <div key={message.id} className={`message ${message.senderId === currentPeerId ? 'me' : ''}`}>
            <div className="meta">
              {senderName}
              {receiverName && ` → ${receiverName}`}
              {' · '}
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
            <div className="content">{message.content}</div>
          </div>
        );
      })}
    </div>
  );
};
