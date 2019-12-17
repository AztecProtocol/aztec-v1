import expectErrorResponse from '~testHelpers/expectErrorResponse';
import * as storage from '~utils/storage';
import AuthService from '~background/services/AuthService';
import EventService from '~background/services/EventService';
import NoteService from '~background/services/NoteService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import syncUserInfo from '../syncUserInfo';
import storyOf, {
    registeredUserInfo,
} from './helpers/stories';

jest.mock('~background/utils/decodeLinkedPublicKey');
jest.mock('~utils/storage');

const {
    address: userAddress,
    linkedPublicKey,
} = registeredUserInfo;

const fetchAccountSpy = jest.spyOn(EventService, 'fetchAztecAccount')
    .mockImplementation(() => ({
        account: registeredUserInfo,
    }));

const syncAccountSpy = jest.spyOn(EventService, 'addAccountToSync')
    .mockImplementation(() => {});

const syncNotesSpy = jest.spyOn(EventService, 'startAutoSync')
    .mockImplementation(() => {});

const decryptNoteSpy = jest.spyOn(NoteService, 'initWithUser')
    .mockImplementation(() => {});

const registerAddressSpy = jest.spyOn(AuthService, 'registerAddress');

beforeEach(() => {
    storage.reset();
    fetchAccountSpy.mockClear();
    syncAccountSpy.mockClear();
    syncNotesSpy.mockClear();
    decryptNoteSpy.mockClear();
    registerAddressSpy.mockClear();
    decodeLinkedPublicKey.mockImplementation(() => linkedPublicKey);
});

const expectStartSyncing = (called = 1) => {
    expect(syncAccountSpy).toHaveBeenCalledTimes(called);
    expect(syncNotesSpy).toHaveBeenCalledTimes(called);
    expect(decryptNoteSpy).toHaveBeenCalledTimes(called);
};

describe('syncUserInfo', () => {
    it('return existing user info in storage', async () => {
        const ensuredAccount = await storyOf('ensureAccount');
        registerAddressSpy.mockClear();

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);

        expect(registerAddressSpy).not.toHaveBeenCalled();
        expectStartSyncing(0);

        const response = await ensuredAccount.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        expect(registerAddressSpy).toHaveBeenCalledTimes(1);
        expectStartSyncing();
    });

    it('register the address if not found in storage and is registered on chain', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');
        const emptyUser = await AuthService.getRegisteredUser(userAddress);
        expect(emptyUser).toBe(null);

        expect(registerAddressSpy).not.toHaveBeenCalled();
        expectStartSyncing(0);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);

        expect(registerAddressSpy).toHaveBeenCalledTimes(1);
        expectStartSyncing(1);
    });

    it('use current credential to generate linkedPublicKey if not registered on chain', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        fetchAccountSpy.mockImplementationOnce(() => ({
            account: {
                ...registeredUserInfo,
                linkedPublicKey: '',
                blockNumber: 0,
            },
        }));

        await expectErrorResponse(async () => ensuredKeyvault.continueWith(syncUserInfo))
            .toBe('address.not.registered');

        expect(registerAddressSpy).not.toHaveBeenCalled();
        expectStartSyncing(0);
    });

    it('replace account in storage if current linkedPublicKey is different than previous one', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        const prevUserInfo = {
            ...registeredUserInfo,
            blockNumber: registeredUserInfo.blockNumber - 100,
            linkedPublicKey: 'prev_linked_public_key',
        };
        await AuthService.registerAddress(prevUserInfo);

        registerAddressSpy.mockClear();

        const prevUser = await AuthService.getRegisteredUser(userAddress);
        expect(prevUser).toEqual(prevUserInfo);
        expectStartSyncing(0);
        expect(registerAddressSpy).not.toHaveBeenCalled();

        const response = await ensuredKeyvault.continueWith(syncUserInfo);

        expect(response.linkedPublicKey).not.toBe(prevUserInfo.linkedPublicKey);
        expect(response).toEqual(registeredUserInfo);

        expect(registerAddressSpy).toHaveBeenCalledTimes(1);
        expectStartSyncing(1);

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);
    });

    it('return error if current linkedPublicKey is different than the one on chain', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        await AuthService.registerAddress(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);

        registerAddressSpy.mockClear();

        fetchAccountSpy.mockImplementationOnce(() => ({
            account: {
                ...registeredUserInfo,
                linkedPublicKey: 'real_linked_public_key',
                blockNumber: 0,
            },
        }));

        await expectErrorResponse(async () => ensuredKeyvault.continueWith(syncUserInfo))
            .toBe('account.duplicated');

        expect(registerAddressSpy).not.toHaveBeenCalled();
        expectStartSyncing(0);
    });
});
