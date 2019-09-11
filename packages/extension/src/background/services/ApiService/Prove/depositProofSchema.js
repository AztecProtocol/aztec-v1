export default {
    id: '/DepositProof',
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
        transactions: {
            type: 'array',
            items: {
                to: {
                    type: 'string',
                },
                amount: {
                    type: 'number',
                },
            },
        },
        required: ['from', 'sender'],
    },
};
