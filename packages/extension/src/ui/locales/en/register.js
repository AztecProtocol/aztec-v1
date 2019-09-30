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
        keys: 'Create Keys',
        password: {
            _: 'Create Password',
            title: 'Create password',
            description: 'Donec ut maximus sapien. You will need this password to login.',
            placeholder: 'Enter your password',
        },
        account: 'Create Account',
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
    extension: {
        description: 'Last step! Link your address with your extension account.',
        step: {
            create: 'Link Account to MetaMask',
            register: 'Register Account',
            completed: 'Account Created!',
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
