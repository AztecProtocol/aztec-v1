export default {
    _: 'Register',
    intro: {
        title: 'Create your privacy keys',
        description: {
            para0: 'AZTEC will now help you create a set of privacy keys that are used to keep your assets private. These are stored in encrypted form.',
            para1: 'We never have access to your keys and your privacy keys do not control the spending of your tokens.',
        },
    },
    create: {
        title: 'Create Keys',
        submit: 'Create',
        password: {
            _: 'Create Password',
            title: 'Create password',
            description: 'This password is used to encrypt your keys, and should be secure. You will need this password to login.',
            placeholder: 'Enter your password',
        },
        account: 'Create Account',
    },
    password: {
        title: 'Create Password',
        submit: 'Encrypt',
    },
    backup: {
        title: 'Backup Seed Phrase',
        description: '',
        submit: 'Download',
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
        important: 'IMPORTANT! Check the signature contains the above values.',
        submit: 'Link Account',
    },
    confirm: {
        title: 'Send Transaction',
        blurb: 'AZTEC relays transactions through the Gas Station Network so you don\'t have to pay gas.',
        explain: 'If you are happy to link your account press send.',
        submit: 'Send',
    },
    link: {
        account: 'Link Account',
    },
};
