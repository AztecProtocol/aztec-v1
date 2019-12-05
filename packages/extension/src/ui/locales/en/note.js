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
        grant: {
            _: 'Grant Access',
            title: 'Grant Note Access',
            submit: 'Grant',
            explain: 'This will allow the address to see the value of this note and construct proofs using this note. It will not be able to spend this note without your approval via MetaMask.',
        },
        invalidAccounts: 'Error: All accounts must have registered the AZTEC extension',
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
            explain: "Existing notes will be destroyed to create the new notes. This will allow the new note's owner to see its value and construct proofs using this note.",
            remainder: {
                description: 'The note total is greater than the required amount, the difference will be credited to your balance:',
            },
        },
    },
    adj: {
        new: 'new',
        existing: 'existing',
    },
};
