import addressType from './address';
import inputAmountType from './inputAmount';

const transactionsType = {
    type: 'array',
    each: {
        to: addressType.isRequired,
        amount: inputAmountType
            .withSize({
                gte: 1,
            })
            .isRequired,
        numberOfOutputNotes: {
            type: 'integer',
            size: {
                gte: 1,
            },
        },
    },
};

transactionsType.isRequired = {
    ...transactionsType,
    size: {
        gte: 1,
    },
    required: true,
};

export default transactionsType;
