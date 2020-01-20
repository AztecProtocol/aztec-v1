import {
    metadata,
} from '@aztec/note-access';
import {
    userAccount,
} from '~testHelpers/testUsers';
import testNotes from '~testHelpers/testNotes';
import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import * as storage from '~/utils/storage';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import getViewingKeyFromMetadata from '../getViewingKeyFromMetadata';
import storyOf from './helpers/stories';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('getViewingKeyFromMetadata', () => {
    const accessArr = [];
    const numberOfAccounts = 2;
    for (let i = 0; i < numberOfAccounts; i += 1) {
        accessArr.push({
            address: `0x${randomId(ADDRESS_LENGTH)}`,
            viewingKey: `0x${randomId(VIEWING_KEY_LENGTH)}`,
        });
    }

    let metadataObj;

    beforeEach(() => {
        metadataObj = metadata('');
        accessArr.forEach(access => metadataObj.addAccess(access));
    });

    it('get viewingKey from metadata and decrypt it', async () => {
        const note = testNotes[randomInt(testNotes.length - 1)];

        metadataObj.addAccess({
            address: userAccount.address,
            viewingKey: note.viewingKey,
        });

        await storyOf('ensureDomainPermission');
        const metadataStr = `0x${''.padEnd(METADATA_AZTEC_DATA_LENGTH, '0')}${metadataObj.toString().slice(2)}`;
        const decrypted = await getViewingKeyFromMetadata(metadataStr);
        expect(decrypted).toBe(note.viewingKey);
    });

    it('return empty string if address is not in metadata', async () => {
        await storyOf('ensureDomainPermission');
        const metadataStr = `0x${''.padEnd(METADATA_AZTEC_DATA_LENGTH, '0')}${metadataObj.toString().slice(2)}`;
        const decrypted = await getViewingKeyFromMetadata(metadataStr);
        expect(decrypted).toBe('');
    });
});
