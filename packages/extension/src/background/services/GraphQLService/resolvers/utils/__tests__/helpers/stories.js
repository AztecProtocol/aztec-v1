import {
    userAccount,
    registrationData,
    pwDerivedKey,
} from '~testHelpers/testUsers';
import AuthService from '~/background/services/AuthService';
import decodeKeyStore from '~/background/utils/decodeKeyStore';

export const domainName = 'aztecprotocol.com';

export const registeredUserInfo = {
    address: userAccount.address,
    linkedPublicKey: userAccount.linkedPublicKey,
    blockNumber: Date.now(),
};

const requiredArgs = {
    currentAddress: userAccount.address,
    domain: domainName,
};

const registerExtension = async () => {
    await AuthService.registerExtension(registrationData);
};

const registerAccount = async () => {
    await registerExtension();
    await AuthService.registerAddress(registeredUserInfo);
};

const registerDomain = async () => {
    await registerAccount();
    await AuthService.registerDomain(domainName);
};

const ensureKeyvault = async () => {
    await registerExtension();

    const keyStore = await AuthService.getKeyStore();
    const session = await AuthService.getSession();

    return {
        keyStore,
        session,
    };
};

export const ensureAccount = async () => {
    await registerAccount();

    const keyStore = await AuthService.getKeyStore();
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const session = await AuthService.getSession();

    return {
        keyStore: decodedKeyStore,
        session,
        user: registeredUserInfo,
    };
};

export const ensureDomainPermission = async () => {
    await registerDomain();

    const keyStore = await AuthService.getKeyStore();
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const session = await AuthService.getSession();
    const domain = await AuthService.getRegisteredDomain(domainName);

    return {
        keyStore: decodedKeyStore,
        session,
        user: registeredUserInfo,
        domain,
    };
};

const stories = {
    ensureKeyvault,
    ensureAccount,
    ensureDomainPermission,
};

export default async function storyOf(name, cb, extraArgs = {}) {
    const args = {
        ...extraArgs,
        ...requiredArgs,
    };

    const ctx = await stories[name]();

    if (cb) {
        return cb(args, ctx);
    }

    return {
        continueWith: async (next, moreExtraArgs = {}) => next({
            ...moreExtraArgs,
            ...args,
        }, ctx),
    };
}
