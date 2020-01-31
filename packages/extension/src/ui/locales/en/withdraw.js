export default {
    title: 'Withdraw ZkTokens',
    approve: {
        description: `A signature is required to withdraw ZkTokens.
            The SDK will pick the most suitable notes for the transaction.
            Check the transaction details are correct before proceeding.
        `,
        allowance: 'Allowance',
        submit: 'Approve Withdraw',
    },
    sign: {
        description: `A MetaMask signature is required to withdraw ZkTokens.
            The signature should contain the following values:
        `,
    },
    confirm: {
        description: `The SDK has picked the most suitable notes for this transaction.
            If everything looks good hit send!
        `,
    },
    send: {
        step: 'Withdrawing ZkTokens',
        description: `The SDK has picked the most suitable notes for this transaction.
            If everything looks good hit send!
        `,
    },
};
