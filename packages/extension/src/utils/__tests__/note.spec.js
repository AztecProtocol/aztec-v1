import {
    metadata,
} from '@aztec/note-access';
import {
    userAccount,
    userAccount2,
} from '~testHelpers/testUsers';
import {
    AZTEC_JS_METADATA_PREFIX_LENGTH,
    VIEWING_KEY_LENGTH,
} from '~/config/constants';
import {
    randomInt,
} from '~/utils/random';
import {
    createNote,
    valueOf,
    valueFromViewingKey,
} from '../note';

const {
    spendingPublicKey,
    address: ownerAddress,
} = userAccount;

describe('createNote', () => {
    it('create an aztec note with spendingPublicKey', async () => {
        const noteValue = randomInt(100);
        const note = await createNote(noteValue, spendingPublicKey, ownerAddress);
        const recoveredValue = valueOf(note);
        expect(recoveredValue).toBe(noteValue);
        expect(note.owner).toBe(ownerAddress);
    });

    it('create an aztec note with custom owner', async () => {
        const noteValue = randomInt(100);
        const note = await createNote(noteValue, spendingPublicKey, userAccount2.address);
        expect(note.owner).toBe(userAccount2.address);
    });

    it('allow to add note access while creating note', async () => {
        const access = {
            address: userAccount.address,
            linkedPublicKey: userAccount.linkedPublicKey,
        };
        const note = await createNote(10, spendingPublicKey, ownerAddress, access);
        const metadataStr = note.exportMetaData();
        const metadataObj = metadata(metadataStr.slice(AZTEC_JS_METADATA_PREFIX_LENGTH));
        const allowedAccess = metadataObj.getAccess(userAccount.address);
        expect(Object.keys(allowedAccess)).toEqual(['address', 'viewingKey']);
        expect(allowedAccess.address).toBe(userAccount.address);
        expect(allowedAccess.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
    });

    it('allow to pass a linkedPublicKey string to create access for owner address', async () => {
        const access = {
            address: userAccount2.address,
            linkedPublicKey: userAccount2.linkedPublicKey,
        };
        const note = await createNote(
            10,
            spendingPublicKey,
            access.address,
            access.linkedPublicKey,
        );
        expect(note.owner).toBe(userAccount2.address);

        const metadataStr = note.exportMetaData();
        const metadataObj = metadata(metadataStr.slice(AZTEC_JS_METADATA_PREFIX_LENGTH));
        const allowedAccess = metadataObj.getAccess(userAccount2.address);
        expect(Object.keys(allowedAccess)).toEqual(['address', 'viewingKey']);
        expect(allowedAccess.address).toBe(userAccount2.address);
        expect(allowedAccess.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
    });

    it('allow to pass an array of access', async () => {
        const access = [
            {
                address: userAccount.address,
                linkedPublicKey: userAccount.linkedPublicKey,
            },
            {
                address: userAccount2.address,
                linkedPublicKey: userAccount2.linkedPublicKey,
            },
        ];
        const note = await createNote(
            10,
            spendingPublicKey,
            userAccount.address,
            access,
        );

        const metadataStr = note.exportMetaData();
        const metadataObj = metadata(metadataStr.slice(AZTEC_JS_METADATA_PREFIX_LENGTH));
        const allowedAccess = metadataObj.getAccess(userAccount.address);
        expect(allowedAccess.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
        const allowedAccess2 = metadataObj.getAccess(userAccount2.address);
        expect(allowedAccess2.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
    });
});

describe('valueFromViewingKey', () => {
    it('get value of a note from real viewing key', async () => {
        const noteValue = randomInt(100);
        const note = await createNote(noteValue, spendingPublicKey, ownerAddress);
        const viewingKey = note.getView();
        expect(valueFromViewingKey(viewingKey)).toBe(noteValue);
    });
});
