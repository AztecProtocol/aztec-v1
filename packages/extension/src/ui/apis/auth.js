import ActionService from '~ui/services/ActionService';
import RegisterExtensionMutation from '~ui/mutations/RegisterExtension';
import RegisterAccountMutation from '~ui/mutations/RegisterAccount';
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
        mutation: RegisterExtensionMutation,
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
}, cb) => ActionService.post(
    requestId,
    'metamask.register.extension',
    account,
    (response) => {
        console.log('>>> linkAccountToMetaMask', response);
        cb(response);
    },
);

export const sendRegisterAddress = async ({
    requestId,
    address,
    linkedPublicKey,
    // spendingPublicKey,
    signature,
}, cb) => ActionService.sendTransaction(
    requestId,
    'AZTECAccountRegistry',
    'registerAZTECExtension',
    [
        address,
        linkedPublicKey,
        // spendingPublicKey,
        signature,
    ],
    cb,
);

export const registerAccount = async ({
    address,
    linkedPublicKey,
    signature,
}, cb) => {
    const response = await apollo.mutate({
        mutation: RegisterAccountMutation,
        variables: {
            address,
            signature,
            linkedPublicKey,
            domain: window.location.origin,
            registeredAt: 0,
        },
    });
    console.log(response);
    const {
        error,
    } = response;

    cb({
        success: !error,
    });
};
