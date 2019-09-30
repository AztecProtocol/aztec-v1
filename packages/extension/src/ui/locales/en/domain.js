export default {
    permission: {
        title: '%{domain} is requesting access to your private assets',
        requesting: {
            _: 'is requesting access to your assets:',
            0: 'is requesting access to your assets.',
            1: 'is requesting access to your asset:',
        },
        explain: `This will allow the page to see your balance
and construct proofs using your AZTEC notes.
The page will not be able to spend your assets without your approval via MetaMask.`,
        grant: {
            _: 'Grant Access',
            error: 'Cannot grant access to domain. Please try again later.',
        },
    },
};
