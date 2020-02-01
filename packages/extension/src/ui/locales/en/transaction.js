export default {
    step: {
        create: {
            proof: 'Creating Proof',
        },
        send: 'Sending Transaction',
        confirmed: 'Confirming Transaction',
        sign: 'Signing Transaction',
        relay: 'Relaying Transaction',
    },
    confirmed: 'Confirmed',
    approve: {
        submit: 'Approve Transaction',
    },
    request: {
        signature: {
            _: 'Signature Request',
            received: 'Signature Received',
        },
    },
    waiting: {
        sign: 'Please sign the transaction in MetaMask',
    },
    sign: {
        submit: 'Sign the transaction',
    },
    send: {
        _: 'Send',
        explain: 'After press send, please complete the transaction through metamask.',
        footnote: 'This window will close automatically once the transaction is confirmed.',
        submit: 'Send Transaction',
    },
    gsn: {
        send: {
            _: 'Send',
            description: `AZTEC sends transactions through the Gas Station Network
                so you don't pay gas and to increase your privacy.
                If everything looks good hit send!
            `,
            explain: 'AZTEC sends transactions through the Gas Station Network so you don\'t pay gas.',
            submit: 'Send',
        },
        error: {
            relayer: 'Relayer is not available at the moment. Please try again later.',
        },
    },
    success: 'Transaction completed!',
    autoClose: 'This window will close automatically when the transaction is confirmed.',
};
