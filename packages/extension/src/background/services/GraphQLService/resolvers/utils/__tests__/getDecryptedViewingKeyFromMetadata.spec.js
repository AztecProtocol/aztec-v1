import {
    userAccount,
} from '~testHelpers/testUsers';
import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import * as storage from '~/utils/storage';
import {
    toString,
} from '~/utils/metadata';
import {
    randomId,
} from '~/utils/random';
import getDecryptedViewingKeyFromMetadata from '../getDecryptedViewingKeyFromMetadata';
import decryptViewingKey from '../decryptViewingKey';
import storyOf from './helpers/stories';

jest.mock('~/utils/storage');
jest.mock('../decryptViewingKey');

beforeEach(() => {
    storage.reset();
});

describe('getDecryptedViewingKeyFromMetadata', () => {
    const aztecData = randomId(METADATA_AZTEC_DATA_LENGTH);
    const addresses = [];
    const viewingKeys = [];
    const numberOfAccounts = 3;
    for (let i = 0; i < numberOfAccounts; i += 1) {
        if (i === 0) {
            addresses.push(userAccount.address);
        } else {
            addresses.push(`0x${randomId(ADDRESS_LENGTH)}`);
        }
        viewingKeys.push(`0x${randomId(VIEWING_KEY_LENGTH)}`);
    }
    const metadataStr = toString({
        aztecData,
        addresses,
        viewingKeys,
    });

    const expectedViewingKey = viewingKeys[0];

    const decryptMock = decryptViewingKey
        .mockImplementation(() => expectedViewingKey);

    afterAll(() => {
        decryptMock.mockRestore();
    });

    it('get viewingKey from metadata and decrypt it', async () => {
        await storyOf('ensureDomainPermission');
        const decrypted = await getDecryptedViewingKeyFromMetadata(metadataStr);
        expect(decrypted).toBe(expectedViewingKey);
    });

    it('return empty string if address is not in metadata', async () => {
        await storyOf('ensureDomainPermission');

        const invalidMetadataStr = toString({
            aztecData,
            addresses: addresses.slice(1),
            viewingKeys: viewingKeys.slice(1),
        });
        const decrypted = await getDecryptedViewingKeyFromMetadata(invalidMetadataStr);
        expect(decrypted).toBe('');
    });
});
