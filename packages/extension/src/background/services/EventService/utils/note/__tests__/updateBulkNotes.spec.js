import {
    createBulkNotes,
    updateBulkNotes,
    destroyBulkNotes,
} from '..';
import Note from '~background/database/models/note';
import {
    clearDB,
} from '~background/database';
import { NOTE_STATUS } from '~config/constants';


describe('updateBulkNotes', () => {
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
        await updateBulkNotes(rawNotes);

        // expected
        const notesAfter = await Note.query().toArray();
        const expectedNotes = rawNotes.map(note => ({
            ...note,
            status: NOTE_STATUS.CREATED,
        }));

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

        // action
        await updateBulkNotes(rawNotes);
        await updateBulkNotes([updateFirstNote]);

        // expected
        const notesAfter = await Note.query().toArray();
        const expectedNotes = rawNotes.map(note => ({
            ...note,
            status: NOTE_STATUS.CREATED,
        }));
        const expectedUpdatedNote = {
            ...updateFirstNote,
            status: NOTE_STATUS.CREATED,
        };

        expect(notesAfter.length).toEqual(rawNotes.length);
        expect(notesAfter[0]).toEqual(expectedUpdatedNote);
        expect(notesAfter[1]).toEqual(expectedNotes[1]);
    });
});


describe('destroyBulkNotes', () => {
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

    it(`should change status of notes to ${NOTE_STATUS.DESTROYED}`, async () => {
        // given
        await createBulkNotes(rawNotes);
        const notesBefore = await Note.query().toArray();
        expect(notesBefore.length).toEqual(2);

        // action
        await destroyBulkNotes(rawNotes);

        // expected
        const notesAfter = await Note.query().toArray();
        const notesExpected = rawNotes.map(rawNote => ({
            ...rawNote,
            status: NOTE_STATUS.DESTROYED,
        }));

        expect(notesAfter.length).toEqual(2);
        expect(notesAfter[0]).toEqual(notesExpected[0]);
        expect(notesAfter[1]).toEqual(notesExpected[1]);
    });
});
