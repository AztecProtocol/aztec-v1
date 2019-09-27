import fetchNotesFromIndexedDB from '../fetchNotesFromIndexedDB';
import Asset from '../../../../database/models/asset';
import Note from '../../../../database/models/note';
import NoteAccess from '../../../../database/models/noteAccess';


describe('fetchNotesFromIndexedDB', () => {
    const note_1 = {
        noteHash: '0x432',
        owner: account_1.address,
        metadata: '0x0',
        blockNumber: 344,
        status: NOTE_STATUS.CREATED,
        networkId: 1,
        asset: '0x34533',
    };

    const noteAccesses = [

    ];

    const asset = [

    ];

    it('should return right notes', async () => {
        // given


        // action

        // expected

    });
});
