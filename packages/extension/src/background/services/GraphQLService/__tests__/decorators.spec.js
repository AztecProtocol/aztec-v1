import {
    userAccount,
    registrationData,
} from '~testHelpers/testUsers';
import * as storage from '~utils/storage';
import AuthService from '~background/services/AuthService';
import expectErrorResponse from '~testHelpers/expectErrorResponse';
import {
    ensureKeyvault,
    ensureAccount,
    ensureDomainPermission,
} from '../decorators';

jest.mock('~utils/storage');

const domainName = 'whatever.com';

const requiredArgs = {
    currentAddress: userAccount.address,
    domain: 'whatever.com',
};

const registeredUserInfo = {
    address: userAccount.address,
    linkedPublicKey: userAccount.linkedPublicKey,
    blockNumber: Date.now(),
};

let callback;

beforeEach(() => {
    storage.reset();
    callback = jest.fn();
});

const useDecorator = async (
    decorator,
    cb = callback,
    args = requiredArgs,
) => decorator(cb)(null, args);

const expectContextToEqual = ctx => expect(callback.mock.calls[0][2]).toEqual(ctx);

describe('ensureKeyvault', () => {
    it('callback will be called if extension is registered', async () => {
        await AuthService.registerExtension(registrationData);

        await useDecorator(ensureKeyvault);

        expect(callback).toHaveBeenCalledTimes(1);

        const keyStore = await AuthService.getKeyStore();
        const session = await AuthService.getSession();
        expectContextToEqual({
            keyStore,
            session,
        });
    });

    it('fail if extension is not registered', async () => {
        await expectErrorResponse(async () => useDecorator(ensureKeyvault))
            .toBe('extension.not.registered');
        expect(callback).not.toHaveBeenCalled();
    });
});

describe('ensureAccount', () => {
    it('callback will be called if both extension and user are registered', async () => {
        await AuthService.registerExtension(registrationData);
        await AuthService.registerAddress(registeredUserInfo);

        await useDecorator(ensureAccount);

        expect(callback).toHaveBeenCalledTimes(1);

        const keyStore = await AuthService.getKeyStore();
        const session = await AuthService.getSession();
        expectContextToEqual({
            keyStore,
            session,
            user: registeredUserInfo,
        });
    });

    it('fail if both extension and user are not registered', async () => {
        await expectErrorResponse(async () => useDecorator(ensureAccount))
            .toBe('extension.not.registered');
        expect(callback).not.toHaveBeenCalled();
    });

    it('fail if extension is not registered', async () => {
        await AuthService.registerAddress(registeredUserInfo);

        await expectErrorResponse(async () => useDecorator(ensureAccount))
            .toBe('extension.not.registered');
        expect(callback).not.toHaveBeenCalled();
    });

    it('fail if user is not registered', async () => {
        await AuthService.registerExtension(registrationData);

        await expectErrorResponse(async () => useDecorator(ensureAccount))
            .toBe('account.not.linked');
        expect(callback).not.toHaveBeenCalled();
    });
});

describe('ensureDomainPermission', () => {
    it('callback will be called if extension, user, and domain are all registered', async () => {
        await AuthService.registerExtension(registrationData);
        await AuthService.registerAddress(registeredUserInfo);
        await AuthService.registerDomain(domainName);

        await useDecorator(ensureDomainPermission);

        expect(callback).toHaveBeenCalledTimes(1);

        const keyStore = await AuthService.getKeyStore();
        const session = await AuthService.getSession();
        const domain = await AuthService.getRegisteredDomain(domainName);
        expectContextToEqual({
            keyStore,
            session,
            user: registeredUserInfo,
            domain,
        });
    });

    it('fail if nothing is registered', async () => {
        await expectErrorResponse(async () => useDecorator(ensureDomainPermission))
            .toBe('extension.not.registered');
        expect(callback).not.toHaveBeenCalled();
    });

    it('fail if user is not registered', async () => {
        await AuthService.registerExtension(registrationData);

        await expectErrorResponse(async () => useDecorator(ensureDomainPermission))
            .toBe('account.not.linked');
        expect(callback).not.toHaveBeenCalled();
    });

    it('fail if doamin is not registered', async () => {
        await AuthService.registerExtension(registrationData);
        await AuthService.registerAddress(registeredUserInfo);

        await expectErrorResponse(async () => useDecorator(ensureDomainPermission))
            .toBe('domain.not.register');
        expect(callback).not.toHaveBeenCalled();
    });
});
