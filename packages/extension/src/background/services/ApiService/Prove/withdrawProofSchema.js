export default {
    id: '/WithdrawProof',
    properties: {
        sender: {
            type: 'string',
            minLength: 42,
            maxLength: 42,
        },
        to: {
            type: 'string',
            minLength: 42,
            maxLength: 42,
        },
        amount: {
            type: 'number',
        },
        required: ['to', 'sender', 'amount'],
    },
};
