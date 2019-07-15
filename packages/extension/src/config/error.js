export const errorTypes = [
    'PERMISSION',
    'ARGUMENTS',
];

export default {
    account: {
        notFound: {
            _: "Account '%{account}' not found.",
            count: '%{count} accounts do not exist.',
            publicKey: "Account '%{account}' does not have a publicKey.",
            publicKeys: '%{count} accounts do not have publicKeys.',
        },
        noteAccess: "Account '%{account}' does not have access to note '%{noteId}'",
    },
};
