import expectErrorResponse from '~helpers/expectErrorResponse';
import * as storage from '~utils/storage';
import AuthService from '~background/services/AuthService';
import GraphNodeService from '~background/services/GraphNodeService';
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

const graphNodeQuerySpy = jest.spyOn(GraphNodeService, 'query')
    .mockImplementation(() => ({
        account: registeredUserInfo,
    }));

const registerAddressSpy = jest.spyOn(AuthService, 'registerAddress');

beforeEach(() => {
    storage.reset();
    graphNodeQuerySpy.mockClear();
    registerAddressSpy.mockClear();
    decodeLinkedPublicKey.mockImplementation(() => linkedPublicKey);
});

describe('syncUserInfo', () => {
    it('return existing user info in storage', async () => {
        const ensuredAccount = await storyOf('ensureAccount');
        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).not.toHaveBeenCalled();
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);

        const response = await ensuredAccount.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(1);
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);
    });

    it('register the address if not found in storage', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');
        const emptyUser = await AuthService.getRegisteredUser(userAddress);
        expect(emptyUser).toBe(null);

        expect(graphNodeQuerySpy).not.toHaveBeenCalled();
        expect(registerAddressSpy).not.toHaveBeenCalled();

        const response = await ensuredKeyvault.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(1);
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);
    });

    it('use current credential to generate linkedPublicKey if not registered on chain', async () => {
        graphNodeQuerySpy.mockImplementationOnce(() => ({
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

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(1);
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);
    });

    it('replace account in storage if current linkedPublicKey is different than previous one', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        const prevUserInfo = {
            ...registeredUserInfo,
            registeredAt: registeredUserInfo.registeredAt - 100,
            linkedPublicKey: 'prev_linked_public_key',
        };
        await AuthService.registerAddress(prevUserInfo);

        expect(graphNodeQuerySpy).not.toHaveBeenCalled();
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);

        const prevUser = await AuthService.getRegisteredUser(userAddress);
        expect(prevUser).toEqual(prevUserInfo);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);

        expect(response.linkedPublicKey).not.toBe(prevUserInfo.linkedPublicKey);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(1);
        expect(registerAddressSpy).toHaveBeenCalledTimes(2);

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);
    });

    it('return error if current linkedPublicKey is different than the one on chain', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        await AuthService.registerAddress(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).not.toHaveBeenCalled();
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(1);
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);

        const newLinkedPublicKey = 'new_linked_public_key';
        expect(response.linkedPublicKey).not.toBe(newLinkedPublicKey);
        decodeLinkedPublicKey.mockImplementation(() => newLinkedPublicKey);

        await expectErrorResponse(async () => ensuredKeyvault.continueWith(syncUserInfo))
            .toBe('account.duplicated');

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(2);
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);

        decodeLinkedPublicKey.mockRestore();
    });

    it('replace linkedPublicKey and reset registeredAt in storage if reset is true', async () => {
        const ensuredKeyvault = await storyOf('ensureKeyvault');

        await AuthService.registerAddress(registeredUserInfo);

        const user = await AuthService.getRegisteredUser(userAddress);
        expect(user).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).not.toHaveBeenCalled();
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);

        const response = await ensuredKeyvault.continueWith(syncUserInfo);
        expect(response).toEqual(registeredUserInfo);

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(1);
        expect(registerAddressSpy).toHaveBeenCalledTimes(1);

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

        expect(graphNodeQuerySpy).toHaveBeenCalledTimes(2);
        expect(registerAddressSpy).toHaveBeenCalledTimes(2);

        decodeLinkedPublicKey.mockRestore();
    });
});
