import { PeerDescriptor } from '../types';

interface Props {
  peers: PeerDescriptor[];
  currentPeerId: string;
  onConnect: (peerId: string) => void;
}

export const PeerList = ({ peers, currentPeerId, onConnect }: Props) => {
  return (
    <div className="card">
      <h2>Peers</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {peers
          .filter((peer) => peer.peerId !== currentPeerId)
          .map((peer) => (
            <li key={peer.peerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {peer.displayName}
                <br />
                <small>{peer.peerId}</small>
              </span>
              <button type="button" onClick={() => onConnect(peer.peerId)}>
                Conectează
              </button>
            </li>
          ))}
        {peers.length <= 1 && <span>Niciun peer disponibil încă.</span>}
      </ul>
    </div>
  );
};
