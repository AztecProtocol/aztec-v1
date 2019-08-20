import {
    requiredArgs,
    registrationData,
    registeredUserInfo,
    domainName,
} from '~helpers/testData';
import * as storage from '~utils/storage';
import AuthService from '~background/services/AuthService';
import SyncService from '~background/services/SyncService';
import expectErrorResponse from '~helpers/expectErrorResponse';
import {
    ensureKeyvault,
    ensureAccount,
    ensureDomainPermission,
} from '../decorators';

jest.mock('~utils/storage');

let callback;
const syncAccountSpy = jest.spyOn(SyncService, 'syncAccount')
    .mockImplementation(() => null);

beforeEach(() => {
    syncAccountSpy.mockClear();
    callback = jest.fn();
});

afterEach(() => {
    storage.reset();
});

afterAll(() => {
    syncAccountSpy.mockRestore();
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

        expect(callback.mock.calls.length).toBe(1);

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
        expect(callback.mock.calls.length).toBe(0);
    });
});

describe('ensureAccount', () => {
    it('callback will be called if both extension and user are registered', async () => {
        await AuthService.registerExtension(registrationData);
        await AuthService.registerAddress(registeredUserInfo);

        await useDecorator(ensureAccount);

        expect(callback.mock.calls.length).toBe(1);
        expect(syncAccountSpy).toHaveBeenCalled();

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
        expect(callback.mock.calls.length).toBe(0);
        expect(syncAccountSpy).not.toHaveBeenCalled();
    });

    it('fail if extension is not registered', async () => {
        await AuthService.registerAddress(registeredUserInfo);

        await expectErrorResponse(async () => useDecorator(ensureAccount))
            .toBe('extension.not.registered');
        expect(callback.mock.calls.length).toBe(0);
        expect(syncAccountSpy).not.toHaveBeenCalled();
    });

    it('fail if user is not registered', async () => {
        await AuthService.registerExtension(registrationData);

        await expectErrorResponse(async () => useDecorator(ensureAccount))
            .toBe('account.not.linked');
        expect(callback.mock.calls.length).toBe(0);
        expect(syncAccountSpy).not.toHaveBeenCalled();
    });
});

describe('ensureDomainPermission', () => {
    it('callback will be called if extension, user, and domain are all registered', async () => {
        await AuthService.registerExtension(registrationData);
        await AuthService.registerAddress(registeredUserInfo);
        await AuthService.registerDomain(domainName);

        await useDecorator(ensureDomainPermission);

        expect(callback.mock.calls.length).toBe(1);

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
        expect(callback.mock.calls.length).toBe(0);
    });

    it('fail if user is not registered', async () => {
        await AuthService.registerExtension(registrationData);

        await expectErrorResponse(async () => useDecorator(ensureDomainPermission))
            .toBe('account.not.linked');
        expect(callback.mock.calls.length).toBe(0);
    });

    it('fail if doamin is not registered', async () => {
        await AuthService.registerExtension(registrationData);
        await AuthService.registerAddress(registeredUserInfo);

        await expectErrorResponse(async () => useDecorator(ensureDomainPermission))
            .toBe('domain.not.register');
        expect(callback.mock.calls.length).toBe(0);
    });
});
