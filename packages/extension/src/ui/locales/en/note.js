export default {
    hash: 'Note Hash',
    value: 'Value',
    access: {
        grant: {
            _: 'Grant Access',
            title: 'Grant Note Access',
            explain: `This will allow the address to see the value of this note.
It will be able to construct proofs using this note.
It will not be able to spend this note without your approval via MetaMask.
`,
        },
    },
};
