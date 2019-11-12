export default {
    permission: {
        title: 'Grant Access',
        requesting: {
            _: 'is requesting access to your assets:',
            0: 'is requesting access to your assets.',
            1: 'is requesting access to your asset:',
        },
        explain: `This will allow the page to see the balance of your assets
and construct proofs using your AZTEC notes.`,
        footer: 'The page will not be able to spend your assets without a signature from your wallet.',
        grant: {
            error: 'Cannot grant access to domain. Please try again later.',
        },
        submit: 'Grant Access',
    },
};
