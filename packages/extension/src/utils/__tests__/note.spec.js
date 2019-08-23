import {
    userAccount,
    userAccount2,
} from '~helpers/testData';
import {
    METADATA_AZTEC_DATA_LENGTH,
    AZTEC_JS_METADATA_PREFIX_LENGTH,
    VIEWING_KEY_LENGTH,
} from '~config/constants';
import {
    randomInt,
} from '~utils/random';
import metadata from '~utils/metadata';
import {
    createNote,
    valueOf,
} from '../note';

describe('createNote', () => {
    const {
        spendingPublicKey,
        address: ownerAddress,
    } = userAccount;

    const metadataLenDiff = METADATA_AZTEC_DATA_LENGTH - AZTEC_JS_METADATA_PREFIX_LENGTH;

    it('create an aztec note with spendingPublicKey', async () => {
        const noteValue = randomInt(100);
        const note = await createNote(noteValue, spendingPublicKey, ownerAddress);
        const recoveredValue = valueOf(note);
        expect(recoveredValue).toBe(noteValue);
        expect(note.owner).toBe(ownerAddress);
    });

    it('allow to add note access while creating note', async () => {
        const access = {
            address: userAccount.address,
            linkedPublicKey: userAccount.linkedPublicKey,
        };
        const note = await createNote(10, spendingPublicKey, ownerAddress, access);
        const metadataStr = note.exportMetaData();
        const metadataObj = metadata(metadataStr.padStart(metadataStr.length + metadataLenDiff, '0'));
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
        const metadataObj = metadata(metadataStr.padStart(metadataStr.length + metadataLenDiff, '0'));
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
        const metadataObj = metadata(metadataStr.padStart(metadataStr.length + metadataLenDiff, '0'));
        const allowedAccess = metadataObj.getAccess(userAccount.address);
        expect(allowedAccess.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
        const allowedAccess2 = metadataObj.getAccess(userAccount2.address);
        expect(allowedAccess2.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
    });

    it('warn if owner is empty', async () => {
        const warnings = [];
        const warnSpy = jest.spyOn(console, 'warn')
            .mockImplementation(msg => warnings.push(msg));

        const note = await createNote(10, spendingPublicKey);

        expect(note.owner).not.toBe(ownerAddress);
        expect(warnings.length).toBe(1);
        expect(warnings[0]).toMatch(/owner address/i);

        warnSpy.mockRestore();
    });
});
