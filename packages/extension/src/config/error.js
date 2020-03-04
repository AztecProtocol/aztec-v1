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
    user: {
        denied: {
            _: 'User denied transactions.',
            auth: 'User denied account authorization.',
        },
    },
    account: {
        not: {
            register: 'Account %{account} is not registered.',
            login: 'Account %{account} is not logged in.',
            linked: 'Address has no linked AZTEC extension account.',
        },
        notFound: {
            _: "Account '%{account}' not found.",
            count: '%{count} accounts do not exist.',
            publicKey: "Account '%{account}' does not have a public key.",
            publicKeys: '%{count} accounts do not have public keys.',
        },
        duplicated: 'Your address has been registered with another password.',
        noteAccess: "Account '%{account}' does not have access to note '%{noteId}'",
        incorrect: {
            password: 'Could not decrypt key vault with password.',
        },
    },
    address: {
        not: {
            registered: 'Address %{address} is not registered.',
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
    erc20: {
        deposit: {
            balance: {
                notEnough: 'ERC20 balance (%{balance}) is not enough to make a deposit of %{erc20Amount}.',
            },
        },
    },
    note: {
        viewingKey: {
            encrypt: 'Failed to encrypt viewing key.',
            recover: 'Failed to recover note from its viewing key.',
            noAccess: 'Please allow at least one user to have access to the note.',
        },
        pick: {
            sum: {
                _: 'Asset balance is not enough to generate %{count} notes with value %{value}.',
                1: 'Asset balance is not enough to generate a note with value %{value}.',
            },
            empty: 'Failed to pick notes from balance.',
            minSum: {
                _: 'Unable to pick %{count} notes whose sum is equal to or larger than %{value}.',
                1: 'Unable to pick a note whose value is equal to or larger than %{value}.',
            },
            count: {
                _: 'Total number of notes is not enough to pick %{count} notes.',
                1: 'Total number of notes is not enough to pick a note.',
            },
        },
        not: {
            found: "Note '%{id}' does not exist.",
        },
    },
    utilityNote: {
        not: {
            found: {
                onChain: "Utility note '%{id}' does not exist on blockchain.",
            },
        },
    },
    data: {
        graphql: 'Something went wrong fetching graphQL data',
    },
    input: {
        invalid: 'Invalid input.',
        returnProof: {
            only: 'Argument [%{args}] will be ignored when `returnProof` is false.',
        },
    },
};
