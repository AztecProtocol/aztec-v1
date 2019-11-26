import Schema from 'validate';
import addressType from './types/address';
import transactionsType from './types/transactions';

export default new Schema({
    assetAddress: addressType.isRequired,
    from: addressType.isRequired,
    sender: addressType.isRequired,
    numberOfOutputNotes: {
        type: Number,
        size: {
            min: 1,
        },
    },
    transactions: transactionsType.isRequired,
});
