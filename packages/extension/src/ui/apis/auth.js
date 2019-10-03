import AuthService from '~background/services/AuthService';
import ensureAccount from '~background/services/GraphQLService/decorators/ensureAccount';
import ConnectionService from '~ui/services/ConnectionService';
import RegisterExtension from '~ui/mutations/RegisterExtension';
import RegisterAccount from '~ui/mutations/RegisterAccount';
import ApproveDomain from '~ui/mutations/ApproveDomain';
import apollo from './helpers/apollo';

export const isLoggedIn = async () => {
    try {
        const {
            address: currentAddress,
        } = await AuthService.getCurrentUser() || {};
        if (!currentAddress) {
            return false;
        }

        const {
            error,
        } = await ensureAccount(() => {})(null, { currentAddress }) || {};

        return !error;
    } catch (error) {
        return false;
    }
};

export const createKeyVault = async ({
    seedPhrase,
    address,
    password,
    salt = 'salty',
}) => {
    const {
        registerExtension: {
            account,
        },
    } = await apollo.mutate({
        mutation: RegisterExtension,
        variables: {
            seedPhrase,
            address,
            salt,
            password,
            domain: window.location.origin,
        },
    });

    return account;
};

export const linkAccountToMetaMask = async (account) => {
    const {
        publicKey: spendingPublicKey,
        ...data
    } = await ConnectionService.post({
        action: 'metamask.register.extension',
        data: account,
    }) || {};

    return {
        ...data,
        spendingPublicKey,
    };
};

export const sendRegisterAddress = async ({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
}) => {
    const {
        txReceipt,
    } = ConnectionService.sendTransaction({
        contract: 'AZTECAccountRegistry',
        method: 'registerAZTECExtension',
        data: [
            address,
            linkedPublicKey,
            spendingPublicKey,
            signature,
        ],
    }) || {};
    const {
        blockNumber,
    } = txReceipt || {};

    return {
        blockNumber,
    };
};

export const registerAccount = async ({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
    blockNumber,
}) => {
    const {
        registerAddress: {
            account,
        } = {},
    } = await apollo.mutate({
        mutation: RegisterAccount,
        variables: {
            address,
            signature,
            linkedPublicKey,
            spendingPublicKey,
            blockNumber,
            domain: window.location.origin,
        },
    });

    return {
        success: !!account,
    };
};

export const approveDomain = async ({
    address,
    domain,
}) => {
    const {
        registerDomain: {
            success,
        },
    } = await apollo.mutate({
        mutation: ApproveDomain,
        variables: {
            address,
            domain,
        },
    });

    return { success };
};

export const getCurrentUser = async () => AuthService.getCurrentUser();
