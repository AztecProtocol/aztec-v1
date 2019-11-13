export default {
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
        description: 'To spend AZTEC notes a signature is required. The note total may be greater than the required amount, the difference will be credited to your balance.',
        footnote: 'IMPORTANT! Check the signature contains the note values shown.',
    },
};
