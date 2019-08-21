import {
    registeredUserInfo,
} from '~helpers/testData';
import expectErrorResponse from '~helpers/expectErrorResponse';
import * as storage from '~utils/storage';
import AuthService from '~background/services/AuthService';
import GraphNodeService from '~background/services/GraphNodeService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import syncUserInfo from '../syncUserInfo';
import storyOf from './helpers/stories';

jest.mock('~background/utils/decodeLinkedPublicKey');
jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

describe('syncUserInfo', () => {
    const graphNodeQuerySpy = jest.spyOn(GraphNodeService, 'query');
    const registerAddressSpy = jest.spyOn(AuthService, 'registerAddress');

    beforeEach(() => {
        decodeLinkedPublicKey.mockImplementation(() => registeredUserInfo.linkedPublicKey);

        graphNodeQuerySpy.mockImplementation(() => ({
            account: registeredUserInfo,
        }));
    });

    afterEach(() => {
        graphNodeQuerySpy.mockClear();
        registerAddressSpy.mockClear();
    });

    afterAll(() => {
        graphNodeQuerySpy.mockRestore();
        registerAddressSpy.mockRestore();
    });

    it('return existing user info in storage', async () => {
        const ensuredAccount = await storyOf('ensureAccount');
        const user = await AuthService.getRegisteredUser(registeredUserInfo.address);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(0);
        expect(registerAddressSpy.mock.calls.length).toBe(1);

        const response = await ensuredAccount.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(1);
        expect(registerAddressSpy.mock.calls.length).toBe(1);
    });

    it('register the address if not found in storage', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');
        const emptyUser = await AuthService.getRegisteredUser(registeredUserInfo.address);
        expect(emptyUser).toBe(null);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(0);
        expect(registerAddressSpy.mock.calls.length).toBe(0);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(registeredUserInfo.address);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(1);
        expect(registerAddressSpy.mock.calls.length).toBe(1);
    });

    it('use current credential to generate linkedPublicKey if not registered on chain', async () => {
        graphNodeQuerySpy.mockImplementation(() => ({
            account: {
                ...registeredUserInfo,
                linkedPublicKey: '',
                registeredAt: 0,
            },
        }));

        const response = await storyOf('ensureKeyvault', syncUserInfo);
        expect(response).toEqual({
            ...registeredUserInfo,
            linkedPublicKey: registeredUserInfo.linkedPublicKey,
            registeredAt: 0,
        });

        expect(graphNodeQuerySpy.mock.calls.length).toBe(1);
        expect(registerAddressSpy.mock.calls.length).toBe(1);
    });

    it('replace account in storage if current linkedPublicKey is different than previous one', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        const prevUserInfo = {
            ...registeredUserInfo,
            registeredAt: registeredUserInfo.registeredAt - 100,
            linkedPublicKey: 'prev_linked_public_key',
        };
        await AuthService.registerAddress(prevUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(0);
        expect(registerAddressSpy.mock.calls.length).toBe(1);

        const prevUser = await AuthService.getRegisteredUser(registeredUserInfo.address);
        expect(prevUser).toEqual(prevUserInfo);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);

        expect(response.linkedPublicKey).not.toBe(prevUserInfo.linkedPublicKey);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(1);
        expect(registerAddressSpy.mock.calls.length).toBe(2);

        const user = await AuthService.getRegisteredUser(registeredUserInfo.address);
        expect(user).toEqual(registeredUserInfo);
    });

    it('return error if current linkedPublicKey is different than the one on chain', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        await AuthService.registerAddress(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(registeredUserInfo.address);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(0);
        expect(registerAddressSpy.mock.calls.length).toBe(1);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(1);
        expect(registerAddressSpy.mock.calls.length).toBe(1);

        const newLinkedPublicKey = 'new_linked_public_key';
        expect(response.linkedPublicKey).not.toBe(newLinkedPublicKey);
        decodeLinkedPublicKey.mockImplementation(() => newLinkedPublicKey);

        await expectErrorResponse(async () => ensuredKeyvault.continueWith(syncUserInfo))
            .toBe('account.duplicated');

        expect(graphNodeQuerySpy.mock.calls.length).toBe(2);
        expect(registerAddressSpy.mock.calls.length).toBe(1);

        decodeLinkedPublicKey.mockRestore();
    });

    it('replace linkedPublicKey and reset registeredAt in storage if reset is true', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        await AuthService.registerAddress(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(registeredUserInfo.address);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(0);
        expect(registerAddressSpy.mock.calls.length).toBe(1);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy.mock.calls.length).toBe(1);
        expect(registerAddressSpy.mock.calls.length).toBe(1);

        const newLinkedPublicKey = 'new_linked_public_key';
        expect(response.linkedPublicKey).not.toBe(newLinkedPublicKey);
        decodeLinkedPublicKey.mockImplementation(() => newLinkedPublicKey);

        const retryResponse = await ensuredKeyvault.continueWith(
            syncUserInfo,
            {
                reset: true,
            },
        );

        expect(retryResponse).toEqual({
            ...registeredUserInfo,
            linkedPublicKey: newLinkedPublicKey,
            registeredAt: 0,
        });

        expect(graphNodeQuerySpy.mock.calls.length).toBe(2);
        expect(registerAddressSpy.mock.calls.length).toBe(2);

        decodeLinkedPublicKey.mockRestore();
    });
});
