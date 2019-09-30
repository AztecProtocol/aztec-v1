export default {
    id: '/WithdrawProof',
    properties: {
        from: {
            type: 'string',
            minLength: 42,
            maxLength: 42,
        },
        sender: {
            type: 'string',
            minLength: 42,
            maxLength: 42,
        },
        amount: {
            type: 'number',
        },
        required: ['from', 'sender', 'amount'],
    },
};
