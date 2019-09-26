import { 
    createBulkNotes,
} from '../';
import Note from '~background/database/models/note';
import {
    clearDB
} from '~background/database';
import { NOTE_STATUS } from '~background/config/constants';


describe('createBulkNotes', () => {

    const rawNotes = [
        {
            noteHash: '0x00000001',
            owner: '0x123',
            metadata: '0x1234',
            blockNumber: 1,
        },
        {
            noteHash: '0x00000002',
            owner: '0x123',
            metadata: '0x1234',
            blockNumber: 1,
        },
    ];

    afterEach(async () => {
        clearDB();
    });

    it('should insert two unique notes with right fields', async () => {
        // given
        const notesBefore = await Note.query().toArray();
        expect(notesBefore.length).toEqual(0);

        // action
        await createBulkNotes(rawNotes);

        // expected
        const notesAfter = await Note.query().toArray();
        const expectedNotes = rawNotes.map(note => ({
            ...note,
            status: NOTE_STATUS.CREATED,
        }))

        expect(notesAfter.length).toEqual(rawNotes.length);
        expect(notesAfter[0]).toEqual(expectedNotes[0]);
        expect(notesAfter[1]).toEqual(expectedNotes[1]);
    });

    it('should update item with same primary key', async () => {
        // given
        const notesBefore = await Note.query().toArray();
        expect(notesBefore.length).toEqual(0);

        const updateFirstNote = {
            ...rawNotes[0],
            metadata: '0x12345',
            status: NOTE_STATUS.DESTROYED,
        };

        await createBulkNotes(rawNotes);

        const notesAfter = await Note.query().toArray();
        expect(notesAfter.length).toEqual(rawNotes.length);

        // action / expected
        await expect(createBulkNotes([updateFirstNote])).rejects.toThrow();
    });

});