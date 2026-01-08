"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.SQLITE_PATH = ':memory:';
const db_1 = require("../src/db");
const messageService_1 = require("../src/services/messageService");
describe('messageService', () => {
    beforeAll(async () => {
        await (0, db_1.initDb)();
    });
    it('stores and retrieves messages deterministically', () => {
        const created = messageService_1.messageService.create({ senderId: 'alice', content: 'hi there' });
        expect(created).toMatchObject({ senderId: 'alice', content: 'hi there' });
        const history = messageService_1.messageService.history();
        expect(history[0]).toMatchObject({ id: created.id, senderId: 'alice' });
    });
});
