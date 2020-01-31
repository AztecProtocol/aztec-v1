export default {
    title: 'Send zkTokens',
    approve: {
        description: `A signature is required to send zkTokens.
            The SDK will pick the most suitable notes for the transaction.
            Check the transaction details are correct before proceeding.
        `,
        submit: 'Looks Good!',
    },
    approved: 'Approved',
    sign: {
        description: `A MetaMask signature is required to send zkTokens.
            The signature should contain the following values:
        `,
    },
    confirm: {
        description: `The SDK has picked the most suitable notes for this transaction.
            If everything looks good hit send!
        `,
    },
    send: {
        step: 'Sending zkTokens',
        description: `The SDK has picked the most suitable notes for this transaction.
            If everything looks good hit send!
        `,
    },
    recipient: 'Recipient',
};
