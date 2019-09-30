import AuthService from '~background/services/AuthService';
import ActionService from '~ui/services/ActionService';
import RegisterExtension from '~ui/mutations/RegisterExtension';
import RegisterAccount from '~ui/mutations/RegisterAccount';
import ApproveDomain from '~ui/mutations/ApproveDomain';
import apollo from './helpers/apollo';

export const createKeyVault = async ({
    seedPhrase,
    address,
    password,
    salt = 'salty',
}, cb) => {
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

    cb(account);
};

export const linkAccountToMetaMask = async ({
    requestId,
    ...account
}, cb) => ActionService
    .post(
        requestId,
        'metamask.register.extension',
        account,
    )
    .onReceiveResponse((response) => {
        const {
            publicKey: spendingPublicKey,
            ...data
        } = response;
        cb({
            ...data,
            spendingPublicKey,
        });
    });

export const sendRegisterAddress = async ({
    requestId,
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
}, cb) => ActionService
    .sendTransaction(
        requestId,
        'AZTECAccountRegistry',
        'registerAZTECExtension',
        [
            address,
            linkedPublicKey,
            spendingPublicKey,
            signature,
        ],
    )
    .onReceiveResponse((response) => {
        const {
            txReceipt: {
                blockNumber,
            } = {},
        } = response || {};
        cb({
            blockNumber,
        });
    });

export const registerAccount = async ({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
    blockNumber,
}, cb) => {
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

    cb({
        success: !!account,
    });
};

export const approveDomain = async ({
    address,
    domain,
}, cb) => {
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

    cb({ success });
};

export const getCurrentUser = async () => AuthService.getCurrentUser();
