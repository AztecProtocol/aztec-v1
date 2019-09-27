import {
    createNote,
    updateNote,
    destroyNote,
} from '..';
import Note from '~background/database/models/note';
import {
    clearDB,
} from '~background/database';
import { NOTE_STATUS } from '~background/config/constants';


describe('updateNote', () => {
    const rawNote = {
        noteHash: '0x00000001',
        owner: '0x123',
        metadata: '0x1234',
        blockNumber: 1,
    };

    afterEach(async () => {
        clearDB();
    });

    it('should insert new note with right fields', async () => {
        // given
        const notesBefore = await Note.query().toArray();
        expect(notesBefore.length).toEqual(0);

        // action
        await updateNote(rawNote);

        // expected
        const notesAfter = await Note.query().toArray();
        const noteExpected = {
            ...rawNote,
            status: NOTE_STATUS.CREATED,
        };

        expect(notesAfter.length).toEqual(1);
        expect(notesAfter[0]).toEqual(noteExpected);
    });

    it('should update existing note with right fields', async () => {
        // given
        const notesBefore = await Note.query().toArray();
        expect(notesBefore.length).toEqual(0);
        const updateNoteFields = {
            ...rawNote,
            metadata: '0x12345',
            owner: '0x126',
            status: 'SOME_OTHER_STATUS',
        };

        // action
        await updateNote(rawNote);
        await updateNote(updateNoteFields);

        // expected
        const notesAfter = await Note.query().toArray();
        const noteExpected = {
            ...updateNoteFields,
            status: NOTE_STATUS.CREATED,
        };

        expect(notesAfter.length).toEqual(1);
        expect(notesAfter[0]).toEqual(noteExpected);
    });
});


describe('destroyNote', () => {
    const rawNote = {
        noteHash: '0x00000001',
        owner: '0x123',
        metadata: '0x1234',
        blockNumber: 1,
    };

    afterEach(async () => {
        clearDB();
    });

    it(`should change status of note to ${NOTE_STATUS.DESTROYED}`, async () => {
        // given
        await createNote(rawNote);
        const notesBefore = await Note.query().toArray();
        expect(notesBefore.length).toEqual(1);

        // action
        await destroyNote(rawNote);

        // expected
        const notesAfter = await Note.query().toArray();
        const noteExpected = {
            ...rawNote,
            status: NOTE_STATUS.DESTROYED,
        };

        expect(notesAfter.length).toEqual(1);
        expect(notesAfter[0]).toEqual(noteExpected);
    });
});
