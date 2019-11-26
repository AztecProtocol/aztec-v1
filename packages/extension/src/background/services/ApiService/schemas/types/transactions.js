const transactionsType = {
    type: Array,
    each: {
        to: {
            type: String,
            length: 42,
            required: true,
        },
        amount: {
            type: Number,
            size: {
                min: 1,
            },
            required: true,
        },
        numberOfOutputNotes: {
            type: Number,
            size: {
                min: 1,
            },
        },
    },
};

transactionsType.isRequired = {
    ...transactionsType,
    required: true,
};

export default transactionsType;
