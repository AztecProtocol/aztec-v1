import * as secp256k1 from '@aztec/secp256k1';
import { randomHex } from 'web3-utils';

import {
    userAccount,
    userAccount2,
} from './helpers/testUsers';
import {
    VIEWING_KEY_LENGTH,
} from '../src/config/constants';
import {
    randomInt,
} from '../src/random';
import metadata from '../src/metadata';
import generateAccessMetaData from '../src/generateAccessMetaData';

const {
    spendingPublicKey,
    address: ownerAddress,
} = userAccount;

describe('grantAccess', () => {
    const metadataLenDiff = 0;

    it('allow to add note access while creating note', async () => {
        const aztecAccount = secp256k1.generateAccount();
        const viewKeyNumBytes = 69;
        const noteViewKey = randomHex(viewKeyNumBytes);

        const access = {
            address: userAccount.address,
            linkedPublicKey: userAccount.linkedPublicKey,
        };

        const metadataStr = generateAccessMetaData(access, noteViewKey, aztecAccount.owner);
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

        await createNote(10, spendingPublicKey);

        expect(warnings.length).toBe(1);
        expect(warnings[0]).toMatch(/owner address/i);

        warnSpy.mockRestore();
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
