import * as storage from '~/utils/storage';
import {
    KeyStore,
} from '~/utils/keyvault';
import userModel from '~/database/models/user';
import domainModel from '~/database/models/domain';
import expectErrorResponse from '~testHelpers/expectErrorResponse';
import {
    userAccount,
    userAccount2,
    registrationData,
    password,
} from '~testHelpers/testUsers';
import AuthService from '..';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('AuthService getters', () => {
    it('get keyStore from storage', async () => {
        const emptyKeyStore = await AuthService.getKeyStore();
        expect(emptyKeyStore).toBe(null);

        await storage.set({
            keyStore: 'test_key_store',
        });

        const keyStore = await AuthService.getKeyStore();
        expect(keyStore).toBe('test_key_store');
    });

    it('get session from storage and recover pwDerivedKey string to uint array', async () => {
        const emptySession = await AuthService.getSession();
        expect(emptySession).toBe(null);

        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password: 'password01',
            salt: 'abc',
        });

        await storage.set({
            session: {
                pwDerivedKey: JSON.stringify(pwDerivedKey),
                foo: 'bar',
            },
        });

        const session = await AuthService.getSession();
        expect(session).toEqual({
            pwDerivedKey,
            foo: 'bar',
        });
    });

    it('will not return session if the pwDerivedKey in it is empty', async () => {
        await storage.set({
            session: {
                pwDerivedKey: '',
                foo: 'bar',
            },
        });

        const session = await AuthService.getSession();
        expect(session).toBe(null);
    });

    it('get domain in storage', async () => {
        const emptyDomain = await AuthService.getRegisteredDomain();
        expect(emptyDomain).toBe(null);

        const domainName = 'whatever.com';
        await domainModel.set({
            domain: domainName,
            assets: [
                'a1',
            ],
        });

        const domain = await AuthService.getRegisteredDomain(domainName);
        expect(domain).toEqual({
            domain: domainName,
            assets: [
                'a1',
            ],
        });
    });

    it('get registered user in storage only when blockNumber is not empty', async () => {
        const emptyUser = await AuthService.getRegisteredUser();
        expect(emptyUser).toBe(null);

        const {
            address,
        } = userAccount;
        await userModel.set({
            address,
            linkedPublicKey: 'linked_public_key',
        });

        const unregisteredUser = await AuthService.getRegisteredUser(address);
        expect(unregisteredUser).toBe(null);

        await userModel.update({
            address,
            blockNumber: 123,
        });

        const user = await AuthService.getRegisteredUser(address);
        expect(user).toEqual({
            address,
            linkedPublicKey: 'linked_public_key',
            blockNumber: 123,
        });
    });

    it('use address in session as the current user', async () => {
        const emptyUser = await AuthService.getCurrentUser();
        expect(emptyUser).toBe(null);

        const {
            address,
        } = userAccount;
        await storage.set({
            session: {
                address,
            },
        });

        const user = await AuthService.getCurrentUser();
        expect(user).toEqual({
            address,
        });
    });
});

describe('AuthService setters', () => {
    let now;

    const constantDate = new Date();

    const advanceTime = () => {
        const advancedTime = Date.now() + 1000;
        now.mockImplementation(() => advancedTime);
        return advancedTime;
    };

    beforeAll(() => {
        now = jest.spyOn(Date, 'now').mockImplementation(() => constantDate.getTime());
    });

    beforeEach(() => {
        now.mockClear();
    });

    afterAll(() => {
        now.mockRestore();
    });

    it('set keyStore and pwDerivedKey to storage from registerExtension', async () => {
        await AuthService.registerExtension(registrationData);

        const keyStore = await AuthService.getKeyStore();

        const {
            pwDerivedKey,
        } = await AuthService.getSession();

        const db = await storage.get();
        expect(db).toEqual({
            keyStore,
            session: {
                pwDerivedKey: JSON.stringify(pwDerivedKey),
                lastActive: constantDate.getTime(),
                createdAt: constantDate.getTime(),
            },
        });
    });

    it('clear session if logged out', async () => {
        await AuthService.registerExtension(registrationData);

        const session = await AuthService.getSession();

        const {
            pwDerivedKey,
        } = session;
        expect(JSON.stringify(pwDerivedKey).length > 0).toBe(true);

        const storageSession = await storage.get('session');
        expect(storageSession).toEqual({
            ...session,
            pwDerivedKey: JSON.stringify(pwDerivedKey),
        });

        await AuthService.logout();

        const newSession = await AuthService.getSession();
        expect(newSession).toBe(null);

        const storageSessionAfterLogout = await storage.get('session');
        expect(storageSessionAfterLogout).toBe(undefined);
    });

    it('can login using correct password', async () => {
        await AuthService.registerExtension(registrationData);

        const {
            pwDerivedKey,
        } = await AuthService.getSession();

        await AuthService.logout();

        const {
            address,
        } = userAccount;

        await AuthService.login({
            address,
            password,
        });

        const {
            pwDerivedKey: pwDerivedKeyAfterLogin,
        } = await AuthService.getSession();

        expect(pwDerivedKeyAfterLogin).toEqual(pwDerivedKey);
    });

    it('can use a different address to login', async () => {
        await AuthService.registerExtension(registrationData);

        const {
            pwDerivedKey,
        } = await AuthService.getSession();

        await AuthService.logout();

        const {
            address,
        } = userAccount2;

        expect(address).not.toBe(userAccount.address);

        await AuthService.login({
            password,
            address,
        });

        const {
            pwDerivedKey: pwDerivedKeyAfterLogin,
        } = await AuthService.getSession();

        expect(pwDerivedKeyAfterLogin).toEqual(pwDerivedKey);
    });

    it('fail to login if wrong password is provided', async () => {
        await AuthService.registerExtension(registrationData);

        await AuthService.logout();

        const {
            address,
        } = userAccount;

        await expectErrorResponse(async () => AuthService.login({
            address,
            password: `${password}0`,
        })).toBe('account.incorrect.password');

        const session = await AuthService.getSession();
        expect(session).toBe(null);
    });

    it('update address and last active time when calling updateSession', async () => {
        await AuthService.registerExtension(registrationData);
        const session = await AuthService.getSession();

        const advancedTime = advanceTime();

        const updateResponse = await AuthService.updateSession(userAccount2.address);

        const newSession = await AuthService.getSession();
        expect(newSession).toEqual({
            ...session,
            address: userAccount2.address,
            lastActive: advancedTime,
        });
        expect(updateResponse).toEqual(newSession);

        expect(newSession.lastActive > session.lastActive).toBe(true);
    });

    it('save user info to storage when calling registerAddress', async () => {
        const {
            address,
        } = userAccount;

        const emptyUser = await userModel.get({ address });
        expect(emptyUser).toBe(null);

        const basicUserInfo = {
            address,
            linkedPublicKey: 'linked_public_key',
        };
        const unregisteredResponse = await AuthService.registerAddress(basicUserInfo);

        expect(unregisteredResponse).toEqual(basicUserInfo);
        const unregisteredUser = await userModel.get({ address });
        expect(unregisteredUser).toEqual(basicUserInfo);
        expect(await AuthService.getRegisteredUser(address)).toBe(null);

        const registeredUserInfo = {
            ...basicUserInfo,
            blockNumber: Date.now(),
        };
        const userResponse = await AuthService.registerAddress(registeredUserInfo);

        expect(userResponse).toEqual(registeredUserInfo);
        const registeredUser = await userModel.get({ address });
        expect(registeredUser).toEqual(registeredUserInfo);
        expect(await AuthService.getRegisteredUser(address)).toEqual(registeredUserInfo);
    });

    it('replace existing user info in storage if register with a new linkedPublicKey or spendingPublicKey or blockNumber', async () => {
        const {
            address,
        } = userAccount;
        const userInfo = {
            address,
            linkedPublicKey: 'linked_public_key',
            spendingPublicKey: 'spending_public_key',
            blockNumber: Date.now(),
        };

        const userResponse = await AuthService.registerAddress(userInfo);
        expect(userResponse).toEqual(userInfo);
        expect(await AuthService.getRegisteredUser(address)).toEqual(userInfo);

        const updatedKey = {
            ...userInfo,
            linkedPublicKey: 'linked_public_key_2',
        };
        await AuthService.registerAddress(updatedKey);
        expect(await AuthService.getRegisteredUser(address)).toEqual(updatedKey);

        const updatedSpending = {
            ...updatedKey,
            spendingPublicKey: 'spending_public_key_2',
        };
        await AuthService.registerAddress(updatedSpending);
        expect(await AuthService.getRegisteredUser(address)).toEqual(updatedSpending);

        const updatedTime = {
            ...updatedKey,
            blockNumber: updatedKey.blockNumber + 1,
        };
        await AuthService.registerAddress(updatedTime);
        expect(await AuthService.getRegisteredUser(address)).toEqual(updatedTime);
    });

    it('will not replace existing user in storage if linkedPublicKey, spendingPublicKey and blockNumber are still the same', async () => {
        const setSpy = jest.spyOn(storage, 'set');

        const {
            address,
        } = userAccount;
        const userInfo = {
            address,
            linkedPublicKey: 'linked_public_key',
            spendingPublicKey: 'spending_public_key',
            blockNumber: Date.now(),
        };
        const storageUserInfo = {
            ...userInfo,
            lastSynced: '1',
        };

        await userModel.set(storageUserInfo);
        expect(setSpy).toHaveBeenCalled();
        setSpy.mockClear();

        expect(await AuthService.getRegisteredUser(address)).toEqual(storageUserInfo);

        await AuthService.registerAddress(userInfo);
        expect(await AuthService.getRegisteredUser(address)).toEqual(storageUserInfo);

        await AuthService.registerAddress({
            ...userInfo,
            lastSynced: '2',
        });
        expect(await AuthService.getRegisteredUser(address)).toEqual(storageUserInfo);

        expect(setSpy).not.toHaveBeenCalled();
        setSpy.mockClear();
    });

    it('save domain to storage by calling registerDomain', async () => {
        const domainName = 'whatever.com';

        const emptyDomain = await AuthService.getRegisteredDomain(domainName);
        expect(emptyDomain).toBe(null);

        const domainResponse = await AuthService.registerDomain(domainName);

        expect(domainResponse).toEqual({
            domain: domainName,
        });
        const registeredDomain = await AuthService.getRegisteredDomain(domainName);
        expect(registeredDomain).toEqual({
            domain: domainName,
        });
    });

    it('will not replace exisint domain if it is already in storgae', async () => {
        const setSpy = jest.spyOn(storage, 'set');

        const domainName = 'whatever.com';
        const storageDomain = {
            domain: domainName,
            assets: [
                'a1',
            ],
        };
        await domainModel.set(storageDomain);

        expect(setSpy).toHaveBeenCalled();
        setSpy.mockClear();

        const exisintDomain = await AuthService.getRegisteredDomain(domainName);
        expect(exisintDomain).toEqual(storageDomain);

        const registeredResponse = await AuthService.registerDomain(domainName);
        expect(registeredResponse).toEqual(storageDomain);
        const registeredDomain = await AuthService.getRegisteredDomain(domainName);
        expect(registeredDomain).toEqual(storageDomain);

        expect(setSpy).not.toHaveBeenCalled();
        setSpy.mockClear();
    });
});
