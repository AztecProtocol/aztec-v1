export default {
    _: 'Register',
    intro: {
        title: 'Create your privacy keys',
        description: {
            para0: 'AZTEC creates a set of privacy keys that are used to keep your assets private. These are stored in encrypted form inside the extension.',
            para1: 'We never have access to your keys. Your privacy keys do not control the spending of assets / tokens.',
            para2: 'These keys are used to decrypt your balance and construct the Zero-Knowledge proofs needed to interact with AZTEC assets, while keeping your balance private.',
        },
    },
    create: {
        keys: 'Create keys',
    },
    backup: {
        title: 'Backup your seed phrase',
        description: '',
        confirm: {
            _: 'I have backed up my seed phrase',
            title: 'A quick check to make sure you backed up',
            description: 'Enter the %{pos0}, %{pos1} and %{pos2} words from your seed phrase below.',
            wrong: {
                phrases: 'Some of the phrases are wrong. Please try again.',
            },
        },
        complete: 'Backup complete',
    },
    restore: {
        fromSeedPhrase: 'Restore from seed phrase',
        title: 'Recover from seed phrase',
        description: '',
        input: {
            seedPhrase: {
                placeholder: 'Enter seed phrase...',
            },
        },
        confirm: 'Recover Account',
        error: {
            seedPhrase: {
                _: 'Incorrect seed phrase format.',
                empty: 'Please enter your seed phrase.',
            },
        },
    },
    address: {
        title: 'Register Ethereum Address with AZTEC',
        description: 'The Ethereum address you are currently using has not been configured to use AZTEC.',
        step: {
            authorise: 'Authorise Address',
        },
    },
    link: {
        account: 'Link Account',
    },
};
