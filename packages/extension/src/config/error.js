export const errorTypes = [
    'PERMISSION',
    'ARGUMENTS',
];

export default {
    account: {
        notFound: {
            _: "Account '%{account}' not found.",
            publicKey: "Account '%{account}' does not have a publicKey.",
        },
        noteAccess: "Account '%{account}' does not have access to note '%{noteId}'",
    },
};
