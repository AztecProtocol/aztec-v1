import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';
import transactionsType from './types/transactions';

export default makeSchema({
    assetAddress: addressType.isRequired,
    transactions: transactionsType.isRequired,
    numberOfInputNotes: {
        type: 'integer',
        size: {
            gte: 1,
        },
    },
    numberOfOutputNotes: {
        type: 'integer',
        size: {
            gte: 1,
        },
    },
});
