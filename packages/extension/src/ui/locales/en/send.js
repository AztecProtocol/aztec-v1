export default {
    title: 'Send ZkTokens',
    approve: {
        description: `A signature is required to send ZkTokens.
            The SDK will pick the most suitable notes for the transaction.
            Check the transaction details are correct before proceeding.
        `,
        submit: 'Looks Good!',
    },
    approved: 'Approved',
    sign: {
        description: `A MetaMask signature is required to send ZkTokens.
            The signature should contain the following values:
        `,
    },
    confirm: {
        description: `The SDK has picked the most suitable notes for this transaction.
            If everything looks good hit send!
        `,
    },
    send: {
        step: 'Sending ZkTokens',
        description: `The SDK has picked the most suitable notes for this transaction.
            If everything looks good hit send!
        `,
    },
    recipient: 'Recipient',
};
