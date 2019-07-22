export const errorTypes = [
    'PERMISSION',
    'ARGUMENTS',
    'DATA',
    'UNKNOWN',
];

export default {
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
    },
    domain: {
        not: {
            register: 'Domain %{domain} is not registered.',
            grantedAccess: {
                asset: "The user has not granted the domain '%{domain}' access to asset '%{asset}'.",
            },
        },
    },
    data: {
        graphql: 'Something went wrong fetching graphQL data',
    },
};
