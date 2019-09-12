import { 
    createBulkNoteAccessFromNotes,
    updateBulkNoteAccessFromNotes,
} from '../';
import {
    createNote,
} from '../../note/index';
import NoteAccess from '~background/database/models/noteAccess';
import Note from '~background/database/models/note';
import {
    clearDB
} from '~background/database';
import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
} from '~config/constants';
import metadata, {
    toString,
} from '~utils/metadata';

const aztecData = ''.padEnd(METADATA_AZTEC_DATA_LENGTH, 'a');
const appData = ''.padEnd(80, 'd');
const addresses = [];
const addressBytes = [];
const viewingKeys = [];
const viewingKeyBytes = [];
const numberOfAccounts = 3;
for (let i = 0; i < numberOfAccounts; i += 1) {
    const address = ''.padEnd(ADDRESS_LENGTH, `ad${i}`);
    addresses.push(address);
    addressBytes.push(`0x${address}`);
    const viewingKey = ''.padEnd(VIEWING_KEY_LENGTH, `c${i}`);
    viewingKeys.push(viewingKey);
    viewingKeyBytes.push(`0x${viewingKey}`);
}

const numberOfNewAccounts = 2;
const newAddressBytes = [];
const newViewingKeyBytes = [];
for (let i = 0; i < numberOfNewAccounts; i += 1) {
    newAddressBytes.push('0x'.padEnd(ADDRESS_LENGTH + 2, `adf${i}`));
    newViewingKeyBytes.push('0x'.padEnd(VIEWING_KEY_LENGTH + 2, `cf${i}`));
}



describe('createBulkNotes', () => {

    const obj = {
        aztecData,
        addresses,
        viewingKeys,
        appData,
    };
    const metadataStr = toString(obj);

    const rawNote = {
        noteHash: '0x00000001',
        owner: '0x123',
        metadata: metadataStr,
        blockNumber: 1,
        asset: '0x542'
    };

    const expectedAccesses = [
        {
            noteHash: rawNote.noteHash,
            blockNumber: rawNote.blockNumber,
            account: `0x${addresses[0]}`,
            viewingKey: `0x${viewingKeys[0]}`,
        },
        {
            noteHash: rawNote.noteHash,
            blockNumber: rawNote.blockNumber,
            account: `0x${addresses[1]}`,
            viewingKey: `0x${viewingKeys[1]}`,
        },
        {
            noteHash: rawNote.noteHash,
            blockNumber: rawNote.blockNumber,
            account: `0x${addresses[2]}`,
            viewingKey: `0x${viewingKeys[2]}`,
        },
    ];

    const expectedNewAccesses = [
        {
            noteHash: rawNote.noteHash,
            blockNumber: rawNote.blockNumber,
            account: newAddressBytes[0],
            viewingKey: newViewingKeyBytes[0],
        },
        {
            noteHash: rawNote.noteHash,
            blockNumber: rawNote.blockNumber,
            account: newAddressBytes[1],
            viewingKey: newViewingKeyBytes[1],
        },
    ];

    const networkId = 0;

    afterEach(async () => {
        clearDB();
    });

    it('should insert note accesses with right fields', async () => {
        // given
        const notesAcccessBefore = await NoteAccess.query({networkId}).toArray();
        expect(notesAcccessBefore.length).toEqual(0);

        // action
        await createBulkNoteAccessFromNotes([rawNote], networkId);

        // expected
        const notesAcccessAfter = await NoteAccess.query({networkId}).toArray();

        expect(notesAcccessAfter.length).toEqual(expectedAccesses.length);
        expect(notesAcccessAfter[0]).toMatchObject(expectedAccesses[0]);
        expect(notesAcccessAfter[1]).toMatchObject(expectedAccesses[1]);
        expect(notesAcccessAfter[2]).toMatchObject(expectedAccesses[2]);
    });

    it('should update note access with 2 new access with right fields', async () => {
        // given
        await createNote(rawNote, networkId);
        await createBulkNoteAccessFromNotes([rawNote], networkId);
        const notesBefore = await Note.query({networkId}).toArray();
        const notesAcccessBefore = await NoteAccess.query({networkId}).toArray();
        expect(notesBefore.length).toEqual(notesBefore.length);
        expect(notesAcccessBefore.length).toEqual(expectedAccesses.length);

        const m = metadata(metadataStr);
        m.addAccess([
            {
                address: newAddressBytes[0],
                viewingKey: newViewingKeyBytes[0],
            },
            {
                address: newAddressBytes[1],
                viewingKey: newViewingKeyBytes[1],
            },
        ]);
        const newRawNote = {
            ...rawNote,
            metadata: toString(m),
        };

        // action
        await updateBulkNoteAccessFromNotes([newRawNote], networkId);

        // expected
        const notesAcccessAfter = await NoteAccess.query({networkId}).toArray();

        expect(notesAcccessAfter.length).toEqual(expectedNewAccesses.length + expectedAccesses.length);
        expect(notesAcccessAfter[0]).toMatchObject(expectedAccesses[0]);
        expect(notesAcccessAfter[1]).toMatchObject(expectedAccesses[1]);
        expect(notesAcccessAfter[2]).toMatchObject(expectedAccesses[2]);

        expect(notesAcccessAfter[3]).toMatchObject(expectedNewAccesses[0]);
        expect(notesAcccessAfter[4]).toMatchObject(expectedNewAccesses[1]);
    });

});