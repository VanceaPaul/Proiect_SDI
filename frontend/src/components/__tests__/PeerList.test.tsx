import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeerList } from '../PeerList';

const peers = [
  { peerId: 'alice', displayName: 'Alice' },
  { peerId: 'bob', displayName: 'Bob' }
];

describe('PeerList', () => {
  it('renders peers and emits connect callback', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<PeerList peers={peers} currentPeerId="alice" onConnect={onConnect} />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Conectează/i }));
    expect(onConnect).toHaveBeenCalledWith('bob');
  });
});
