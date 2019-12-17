import {
    userAccount,
    registrationData,
} from '~testHelpers/testUsers';
import * as storage from '~utils/storage';
import AuthService from '~background/services/AuthService';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import expectErrorResponse from '~testHelpers/expectErrorResponse';
import {
    validateExtension,
    validateSession,
    validateAccount,
    validateDomain,
} from '../validators';

jest.mock('~utils/storage');

beforeEach(() => {
    storage.reset();
});

const requiredArgs = {
    currentAddress: userAccount.address,
    domain: 'whatever.com',
};

const useValidator = async (
    validator,
    args = requiredArgs,
    ctx,
) => validator(null, args, ctx);

describe('validateExtension', () => {
    it('pass and receive keyStore if extension is registered', async () => {
        await AuthService.registerExtension(registrationData);
        const response = await useValidator(validateExtension);
        const keyStore = await AuthService.getKeyStore();
        expect(response).toEqual({
            keyStore,
        });
    });

    it('fail if extension is not registered', async () => {
        await expectErrorResponse(async () => useValidator(validateExtension))
            .toBe('extension.not.registered');
    });
});

describe('validateSession', () => {
    const constantDate = new Date();
    const nowSpy = jest.spyOn(Date, 'now');

    const unitFactorMapping = {
        ms: 1,
        day: 86400000,
    };

    const advanceTime = (time, unit = 'ms') => {
        const advancedTime = Date.now() + time * unitFactorMapping[unit];
        nowSpy.mockImplementation(() => advancedTime);
        return advancedTime;
    };

    beforeEach(() => {
        nowSpy.mockClear();
        nowSpy.mockImplementation(() => constantDate.getTime());
    });

    afterAll(() => {
        nowSpy.mockRestore();
    });

    it('pass and receive session if session is valid', async () => {
        await AuthService.registerExtension(registrationData);
        const response = await useValidator(validateSession);
        const session = await AuthService.getSession();
        expect(response).toEqual({
            session,
        });
    });

    it('fail if there is no session', async () => {
        await expectErrorResponse(async () => useValidator(validateSession))
            .toBe('account.not.login');

        const session = await AuthService.getSession();
        expect(session).toBe(null);
    });

    it('fail if last active time is a while ago', async () => {
        await AuthService.registerExtension(registrationData);

        const session = await AuthService.getSession();
        const response = await useValidator(validateSession);
        expect(response).toEqual({
            session,
        });

        advanceTime(7, 'day');

        const responseInDay7 = await useValidator(validateSession);
        expect(responseInDay7).toEqual({
            session,
        });

        advanceTime(1, 'ms');

        const sessionAfterDay7 = await AuthService.getSession();
        expect(sessionAfterDay7).toEqual(session);

        await expectErrorResponse(async () => useValidator(validateSession))
            .toBe('account.not.login');
    });

    it('fail if session is created a while ago', async () => {
        await AuthService.registerExtension(registrationData);
        const session = await AuthService.getSession();

        advanceTime(21, 'day');
        await AuthService.updateSession(userAccount.address);

        const responseInDay21 = await useValidator(validateSession);
        expect(responseInDay21).toEqual({
            session: {
                ...session,
                address: userAccount.address,
                lastActive: session.lastActive + (21 * 86400000),
            },
        });

        advanceTime(1, 'ms');

        const sessionAfterDay21 = await AuthService.getSession();
        expect(sessionAfterDay21).toEqual({
            ...session,
            address: userAccount.address,
            lastActive: session.lastActive + (21 * 86400000),
        });

        await expectErrorResponse(async () => useValidator(validateSession))
            .toBe('account.not.login');
    });
});

describe('validateAccount', () => {
    let decodedKeyStore;
    let pwDerivedKey;
    let linkedPublicKey;
    let registeredUserInfo;
    let accumContext;
    const updateSessionSpy = jest.spyOn(AuthService, 'updateSession');

    const useAccountValidator = async () => useValidator(
        validateAccount,
        requiredArgs,
        accumContext,
    );

    beforeEach(async () => {
        updateSessionSpy.mockClear();

        await AuthService.registerExtension(registrationData);

        const keyStore = await AuthService.getKeyStore();
        const session = await AuthService.getSession();
        ({
            pwDerivedKey,
        } = session);

        decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);

        linkedPublicKey = decodeLinkedPublicKey(decodedKeyStore, pwDerivedKey);

        registeredUserInfo = {
            address: userAccount.address,
            linkedPublicKey,
            blockNumber: Date.now(),
        };

        accumContext = {
            keyStore,
            session,
        };
    });

    afterAll(() => {
        updateSessionSpy.mockRestore();
    });

    it('pass and return user info with decoded keyStore and session', async () => {
        await AuthService.registerAddress(registeredUserInfo);

        expect(updateSessionSpy).not.toHaveBeenCalled();

        const response = await useAccountValidator();

        expect(updateSessionSpy).toHaveBeenCalled();

        const session = await AuthService.getSession();
        expect(response).toEqual({
            keyStore: decodedKeyStore,
            session,
            user: registeredUserInfo,
        });
    });

    it('fail if blockNumber is empty', async () => {
        const userInfo = {
            ...registeredUserInfo,
            blockNumber: 0,
        };
        await AuthService.registerAddress(userInfo);

        await expectErrorResponse(async () => useAccountValidator())
            .toBe('account.not.linked');

        expect(updateSessionSpy).not.toHaveBeenCalled();
    });

    it('fail if user is not in storage', async () => {
        const emptyUser = await AuthService.getRegisteredUser(userAccount.address);
        expect(emptyUser).toBe(null);

        await expectErrorResponse(async () => useAccountValidator())
            .toBe('account.not.linked');

        expect(updateSessionSpy).not.toHaveBeenCalled();
    });

    it('fail if not receive valid keyStore through context', async () => {
        await AuthService.registerAddress(registeredUserInfo);

        await expectErrorResponse(async () => useValidator(
            validateAccount,
            requiredArgs,
            {},
        )).toBe('account.incorrect.password');

        expect(updateSessionSpy).not.toHaveBeenCalled();
    });
});

describe('validateDomain', () => {
    const domainName = 'whatever.com';

    it('pass and return domain info', async () => {
        const emptyDomain = await AuthService.getRegisteredDomain(domainName);
        expect(emptyDomain).toBe(null);

        const registeredDomain = await AuthService.registerDomain(domainName);

        const response = await useValidator(validateDomain, {
            domain: domainName,
        });

        expect(response).toEqual({
            domain: registeredDomain,
        });
    });

    it('fail if domain is not registered', async () => {
        const emptyDomain = await AuthService.getRegisteredDomain(domainName);
        expect(emptyDomain).toBe(null);

        await expectErrorResponse(async () => useValidator(validateDomain, {
            domain: domainName,
        })).toBe('domain.not.register');
    });
});
