import {
    userAccount,
} from '~testHelpers/testUsers';
import {
    aztecNoteToData,
    recoverNote,
} from '../transformData';
import {
    createNote,
    valueOf,
} from '../note';

const {
    spendingPublicKey,
    address: ownerAddress,
    linkedPublicKey,
} = userAccount;

describe('aztecNoteToData and recoverNote', () => {
    it('convert an aztec note to static data structure and back', async () => {
        const noteValue = 10;
        const note = await createNote(
            noteValue,
            spendingPublicKey,
            ownerAddress,
        );
        const decryptedViewingKey = await note.getView();
        const noteData = aztecNoteToData(note);
        expect(noteData).toEqual({
            value: noteValue,
            noteHash: note.noteHash,
            decryptedViewingKey,
            metadata: '',
            owner: ownerAddress,
        });

        const recovered = await recoverNote(noteData);
        expect(recovered.noteHash).toBe(note.noteHash);
        expect(recovered.owner).toBe(note.owner);
        expect(recovered.metaData).toBe(note.metaData);
        expect(valueOf(recovered)).toBe(noteValue);
    });

    it('convert an aztec note with user access', async () => {
        const noteValue = 10;
        const userAccess = [
            {
                address: ownerAddress,
                linkedPublicKey,
            },
        ];
        const note = await createNote(
            noteValue,
            spendingPublicKey,
            ownerAddress,
            userAccess,
        );
        const decryptedViewingKey = await note.getView();
        const noteData = aztecNoteToData(note);
        expect(noteData).toEqual({
            value: noteValue,
            noteHash: note.noteHash,
            decryptedViewingKey,
            metadata: expect.stringMatching(/0x[0-9a-f]{1,}$/i),
            owner: ownerAddress,
        });

        const recovered = await recoverNote(noteData);
        expect(recovered.noteHash).toBe(note.noteHash);
        expect(recovered.owner).toBe(note.owner);
        expect(recovered.metaData).toBe(note.metaData);
        expect(valueOf(recovered)).toBe(noteValue);
    });
});
