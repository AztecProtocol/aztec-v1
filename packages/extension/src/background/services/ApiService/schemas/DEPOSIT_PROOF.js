import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';
import transactionsType from './types/transactions';

export default makeSchema({
    assetAddress: addressType.isRequired,
    transactions: transactionsType.isRequired,
    numberOfOutputNotes: {
        type: 'integer',
        size: {
            gte: 1,
        },
    },
    userAccess: {
        type: 'array',
        each: addressType,
    },
    returnProof: {
        type: 'boolean',
    },
    sender: addressType,
    publicOwner: addressType,
});
