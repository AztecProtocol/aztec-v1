import { randomHex } from 'web3-utils';

import { userAccount, userAccount2 } from './helpers/testUsers';
import { VIEWING_KEY_LENGTH } from '../src/config/constants';

import metadata from '../src/metadata';
import generateAccessMetaData from '../src/generateAccessMetaData';

describe('Generate access metaData', () => {
    const viewKeyNumBytes = 69;

    it('allow to add note access while creating note', async () => {
        const access = {
            address: userAccount.address,
            linkedPublicKey: userAccount.linkedPublicKey,
        };
        const noteViewKey = randomHex(viewKeyNumBytes);

        const metadataStr = generateAccessMetaData(access, noteViewKey, userAccount.address);
        const metadataObj = metadata(metadataStr.padStart(metadataStr.length, '0'));
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
        const noteViewKey = randomHex(viewKeyNumBytes);

        const metadataStr = generateAccessMetaData(access, noteViewKey, userAccount2.address);
        const metadataObj = metadata(metadataStr.padStart(metadataStr.length, '0'));
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
        const noteViewKey = randomHex(viewKeyNumBytes);

        const metadataStr = generateAccessMetaData(access, noteViewKey, userAccount.address);
        const metadataObj = metadata(metadataStr.padStart(metadataStr.length, '0'));
        const allowedAccess = metadataObj.getAccess(userAccount.address);
        expect(allowedAccess.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
        const allowedAccess2 = metadataObj.getAccess(userAccount2.address);
        expect(allowedAccess2.viewingKey.length).toBe(VIEWING_KEY_LENGTH + 2);
    });
});
