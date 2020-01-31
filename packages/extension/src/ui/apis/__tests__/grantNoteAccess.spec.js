import {
    metadata,
} from '@aztec/note-access';
import {
    userAccount,
    userAccount2,
} from '~testHelpers/testUsers';
import {
    METADATA_AZTEC_DATA_LENGTH,
    REAL_VIEWING_KEY_LENGTH,
} from '~/config/constants';
import {
    randomId,
} from '~/utils/random';
import grantNoteAccess from '../note/grantNoteAccess';

describe('grantNoteAccess', () => {
    it('take a note and accounts array and return new metadata', () => {
        const accounts = [
            userAccount,
            userAccount2,
        ];

        const {
            metadata: newMetaDataStr,
        } = grantNoteAccess({
            note: {
                decryptedViewingKey: `0x${randomId(REAL_VIEWING_KEY_LENGTH)}`,
                metadata: '',
            },
            userAccessAccounts: accounts,
        });

        const newMetaData = metadata(newMetaDataStr.slice(METADATA_AZTEC_DATA_LENGTH + 2));

        accounts.forEach(({
            address,
        }) => {
            const userAccess = newMetaData.getAccess(address);
            expect(userAccess.address).toBe(address);
        });
    });
});
