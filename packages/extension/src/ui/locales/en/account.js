export default {
    create: {
        _: 'Create new account',
        title: 'AZTEC',
        already: 'Already have an account?',
    },
    login: {
        _: 'Login',
        title: 'Login',
        description: 'Your session has expired. Please login with your password:',
        password: {
            placeholder: '',
        },
        submit: 'Login',
        failed: 'Cannot login to your account. Incorrect password.',
    },
    address: {
        _: 'Address',
    },
    password: {
        weak: 'Weak',
        fair: 'Fair',
        good: 'Good',
        strong: 'Strong',
        error: {
            empty: 'Please enter your password.',
            incorrect: 'Incorrect password.',
        },
    },
    linkedPublicKey: {
        _: 'Linked public key',
    },
    restore: {
        _: 'Restore account',
        submit: 'Restore',
        fromSeedPhrase: 'Restore from seed phrase',
        title: 'Recover Account',
        description: 'Please enter the seed phrase you used to register with the following address:',
        link: {
            description: 'The following address will be linked to your account after recovery.',
        },
        password: {
            description: 'Create a new password for your account.',
        },
        input: {
            seedPhrase: {
                placeholder: 'Enter seed phrase...',
            },
        },
        confirm: 'Recover Account',
        abort: {
            and: {
                create: 'Cancel and create new account',
            },
        },
        processing: {
            _: 'Restoring your account...',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit with the address:',
        },
        complete: 'Account successfully restored!',
        failed: {
            title: 'Failed to recover account',
            description: 'We cannot restore your account with the seed phrase you provided. Please use a correct one or create a new account.',
            seedPhrase: 'We cannot restore your account with the seed phrase you provided. Please use the seed phrase you were given when registered with the address.',
            retry: 'Restore with another seed phrase',
        },
        error: {
            seedPhrase: {
                _: 'Incorrect seed phrase format.',
                empty: 'Please enter your seed phrase.',
            },
        },
    },
    duplicated: {
        title: 'Account already exists',
        description: 'This address has been registered with an AZTEC account.',
        clear: {
            _: 'Clear previous account',
        },
    },
    assets: {
        title: 'My Assets',
    },
};
