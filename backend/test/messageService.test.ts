process.env.SQLITE_PATH = ':memory:';

import { initDb } from '../src/db';
import { messageService } from '../src/services/messageService';

describe('messageService', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('stores and retrieves messages deterministically', () => {
    const created = messageService.create({ senderId: 'alice', content: 'hi there' });
    expect(created).toMatchObject({ senderId: 'alice', content: 'hi there' });

    const history = messageService.history();
    expect(history[0]).toMatchObject({ id: created.id, senderId: 'alice' });
  });
});
