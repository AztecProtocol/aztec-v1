export default {
    _: 'Note',
    count: {
        _: '%{count} notes',
        1: 'a note',
        withAdj: {
            _: '%{count} %{adj} notes',
            1: 'a %{adj} note',
        },
    },
    hash: 'Note Hash',
    value: 'Value',
    access: {
        recipient: {
            title: 'Access',
        },
        grant: {
            title: 'Grant Access',
            step: 'Granting Access',
            description: `This will grant another user view access to a portion of your balance.
                It will not allow the ZkTokens to be spent without a signature from your MetaMask account.
            `,
            submit: 'Grant Access',
        },
        sign: {
            description: `A MetaMask signature is required to grant access to ZkTokens.
                The signature should contain the following values:
            `,
        },
        confirm: {
            description: `A MetaMask signature is required to grant access to ZkTokens.
                The signature should contain the following values:
            `,
        },
        send: {
            description: `A MetaMask signature is required to grant access to ZkTokens.
                The signature should contain the following values:
            `,
        },
    },
    sign: {
        title: 'Approve Note Spending',
        description: 'To spend AZTEC notes a signature is required. The note total may be greater than the required amount, the difference will be credited to your balance.',
        footnote: 'IMPORTANT! Check the signature contains the note values shown.',
        submit: 'Sign',
    },
    create: {
        fromBalance: {
            _: 'Create Note',
            title: 'Create new note from asset %{asset}',
            description: 'This proof will create %{newNoteText} from %{oldNoteText}.',
            submit: 'Create Proof',
            explain: 'The existing notes will be destroyed to create the new notes. You are still the owner of the new notes.',
            remainder: {
                description: 'The note total is greater than the required amount, the difference will be credited to your balance:',
            },
            share: {
                explain: 'The above addresses can see the value of the new notes. They will not be able to spend the notes without your approval.',
            },
        },
    },
    adj: {
        new: 'new',
        existing: 'existing',
    },
};
