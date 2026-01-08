import { useState } from 'react';
import { Composer } from './components/Composer';
import { MessageList } from './components/MessageList';
import { PeerList } from './components/PeerList';
import { usePeerClient } from './hooks/usePeerClient';

const App = () => {
  const [displayName, setDisplayName] = useState('Explorer');
  const [enabled, setEnabled] = useState(false);
  const { peerId, peers, messages, status, error, connectToPeer, sendMessage } = usePeerClient({
    displayName,
    enabled
  });
  const [activeConversation, setActiveConversation] = useState<string | undefined>(undefined);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>DeChat</h1>
        <p style={{ color: '#475569' }}>Sistem de mesagerie descentralizat P2P</p>
        <label htmlFor="displayName">Alias</label>
        <input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Numele tău"
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        <button type="button" onClick={() => setEnabled((prev) => !prev)}>
          {enabled ? 'Deconectează' : 'Intră în rețea'}
        </button>
        <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          ID-ul tău: <strong>{peerId}</strong>
        </p>
        <p>Stare: {status}</p>
        {error && <p style={{ color: 'tomato' }}>{error}</p>}
        <PeerList
          peers={peers}
          currentPeerId={peerId}
          onConnect={async (id) => {
            setActiveConversation(id);
            try {
              await connectToPeer(id);
            } catch (e) {
              /* ignore */
            }
          }}
        />
      </aside>
      <main className="main">
        <MessageList messages={messages} peers={peers} currentPeerId={peerId} activeConversation={activeConversation} />
        <Composer peers={peers} currentPeerId={peerId} onSend={sendMessage} activeConversation={activeConversation} onSetConversation={setActiveConversation} />
      </main>
    </div>
  );
};

export default App;
