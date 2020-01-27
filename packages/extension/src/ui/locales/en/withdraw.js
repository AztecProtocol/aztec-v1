export default {
    title: 'Withdraw ZkTokens',
    approve: {
        description: `A signature is required to withdraw ZkNotes.
            The SDK will pick the most suitable notes for the transaction.
            Check the transaction details are correct before proceeding.
        `,
        submit: 'Approve Withdraw',
    },
    sign: {
        description: `A MetaMask signature is required to withdraw ZkNotes.
            The signature should contain the following values:
        `,
    },
    confirm: {
        description: `A MetaMask signature is required to withdraw ZkNotes.
            The signature should contain the following values:
        `,
    },
    send: {
        step: 'Withdrawing ZkTokens',
        description: `A MetaMask signature is required to withdraw ZkNotes.
            The signature should contain the following values:
        `,
    },
    from: 'From',
    amount: {
        total: 'Total amount',
    },
};
