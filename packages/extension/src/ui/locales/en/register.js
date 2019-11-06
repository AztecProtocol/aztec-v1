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
        title: 'Create Keys',
        submitText: 'Create',
        cancelText: 'Cancel',
        password: {
            _: 'Create Password',
            title: 'Create password',
            description: 'Donec ut maximus sapien. You will need this password to login.',
            placeholder: 'Enter your password',
        },
        account: 'Create Account',
    },
    password: {
        title: 'Create password',
        submitText: 'Encrypt',
        cancelText: 'Cancel',
    },
    backup: {
        title: 'Backup your seed phrase',
        description: '',
        submitText: 'Download',
        cancelText: 'Cancel',
        pdf: {
            title: 'AZTEC Recovery Kit',
            blurb: 'This kit is used to recover your AZTEC account and unlock your private assets. We recomend you print it out, and store it offline in a safe place',
            warning: 'WARNING if you loose this document you will not be able to recover you account and will loose access to your assets.',
            account: 'Ethereum Account',
            recovery: 'Recovery Phrase',
            filename: 'AZTEC_Recovery_Kit.pdf',
        },
        // confirm: {
        //     _: 'I have backed up my seed phrase',
        //     title: 'A quick check to make sure you backed up',
        //     description: 'Enter the %{pos0}, %{pos1} and %{pos2} words from your seed phrase below.',
        //     wrong: {
        //         phrases: 'Some of the phrases are wrong. Please try again.',
        //     },
        // },
        // complete: 'Backup complete',
    },
    linkAccount: {
        title: 'Link Ethereum Account',
        blurb: 'In order to use AZTEC, you need to link  an EIP712 compatible wallet to your privacy keys with a signature.',
        submitText: 'Link Account',
        cancelText: 'Cancel',
    },
    confirm: {
        title: 'Send Transaction',
        blurb: 'AZTEC relays transactions through the Gas Station Network so you don\'t have to pay gas fees. Click send to send the transaction.',
        submitText: 'Send',
        cancelText: 'Cancel',
    },
    link: {
        account: 'Link Account',
    },
};
