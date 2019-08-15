import * as storage from '~utils/storage';
import {
    KeyStore,
} from '~utils/keyvault';
import {
    permissionError,
} from '~utils/error';
import userModel from '~database/models/user';
import domainModel from '~database/models/domain';
import AuthService from '..';

jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

const userAccount = {
    address: '0x3339C3c842732F4DAaCf12aed335661cf4eab66b',
};

const userAccount2 = {
    address: '0x0563a36603911daaB46A3367d59253BaDF500bF9',
};

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

    it('get registered user in storage only when registeredAt is not empty', async () => {
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
            registeredAt: 123,
        });

        const user = await AuthService.getRegisteredUser(address);
        expect(user).toEqual({
            address,
            linkedPublicKey: 'linked_public_key',
            registeredAt: 123,
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

    const registrationData = {
        password: 'password01',
        salt: 'sss',
        address: userAccount.address,
        seedPhrase: 'sunny rival motion enforce misery retreat cram acid define use they purpose',
    };

    const advanceTime = () => {
        const advancedTime = Date.now() + 1;
        now = jest.spyOn(Date, 'now').mockImplementation(() => advancedTime);
        return advancedTime;
    };

    beforeAll(() => {
        now = jest.spyOn(Date, 'now').mockImplementation(() => constantDate.getTime());
    });

    beforeEach(async () => {
        const emptyDb = await storage.get();
        expect(emptyDb).toEqual({});
    });

    afterAll(() => {
        now.mockRestore();
    });

    it('set keyStore and pwDerivedKey to storage from registerExtension', async () => {
        await AuthService.registerExtension(registrationData);

        const keyStore = await AuthService.getKeyStore();
        const {
            address,
        } = userAccount;
        const user = userModel.toStorageData({
            address,
            linkedPublicKey: keyStore.privacyKeys.publicKey,
        });

        const {
            pwDerivedKey,
        } = await AuthService.getSession();

        const db = await storage.get();
        expect(db).toEqual({
            keyStore,
            session: {
                address,
                pwDerivedKey: JSON.stringify(pwDerivedKey),
                lastActive: constantDate.getTime(),
                createdAt: constantDate.getTime(),
            },
            user: {
                [address]: user,
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
        const {
            password,
        } = registrationData;

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
            password,
        } = registrationData;
        const {
            address,
        } = userAccount2;

        expect(address).not.toBe(registrationData.address);

        await AuthService.login({
            password,
            address,
        });

        const {
            pwDerivedKey: pwDerivedKeyAfterLogin,
        } = await AuthService.getSession();

        expect(pwDerivedKeyAfterLogin).toEqual(pwDerivedKey);
    });

    it('will fail if wrong password is provided', async () => {
        await AuthService.registerExtension(registrationData);

        await AuthService.logout();

        const {
            address,
        } = userAccount;
        const {
            password,
        } = registrationData;

        let error;
        try {
            await AuthService.login({
                address,
                password: `${password}0`,
            });
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(permissionError('account.incorrect.password'));

        const session = await AuthService.getSession();

        expect(session).toBe(null);
    });

    it('will update address and last active time when calling updateSession', async () => {
        await AuthService.registerExtension(registrationData);
        const session = await AuthService.getSession();

        const advancedTime = advanceTime();

        await AuthService.updateSession(userAccount2.address);

        const anotherSession = await AuthService.getSession();
        expect(anotherSession).toEqual({
            ...session,
            address: userAccount2.address,
            lastActive: advancedTime,
        });

        expect(anotherSession.lastActive > session.lastActive).toBe(true);
    });
});
