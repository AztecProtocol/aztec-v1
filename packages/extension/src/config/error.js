export const errorTypes = [
    'PERMISSION',
    'ARGUMENTS',
    'DATA',
    'UNKNOWN',
];

export default {
    extension: {
        not: {
            registered: 'The user has not setup the AZTEC extension.',
        },
        timeout: 'The request timed out because the user did not respond to the notification.',
    },
    account: {
        not: {
            register: 'Account %{account} is not registered.',
            login: 'Account %{account} is not logged in.',
        },
        notFound: {
            _: "Account '%{account}' not found.",
            count: '%{count} accounts do not exist.',
            publicKey: "Account '%{account}' does not have a public key.",
            publicKeys: '%{count} accounts do not have public keys.',
        },
        noteAccess: "Account '%{account}' does not have access to note '%{noteId}'",
        incorrect: {
            password: 'Could not decrypt key vault with password.',
        },
    },
    domain: {
        not: {
            register: 'Domain %{domain} is not registered.',
            grantedAccess: {
                asset: "The user has not granted the domain '%{domain}' access to asset '%{asset}'.",
                note: "The user has not granted the domain '%{domain}' access to note with asset '%{asset}'.",
            },
        },
    },
    asset: {
        notFound: {
            _: "Asset '%{asset}' is not found.",
            onChain: "Asset '%{asset}' does not exist on blockchain.",
        },
        balance: {
            notEnough: 'Asset balance is not enough.',
        },
    },
    data: {
        graphql: 'Something went wrong fetching graphQL data',
    },

};
