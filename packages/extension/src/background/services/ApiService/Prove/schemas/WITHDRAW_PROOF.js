import Schema from 'validate';
import transactionsType from './types/transactions';

export default new Schema({
    assetAddress: {
        type: String,
        length: 42,
        required: true,
    },
    sender: {
        type: String,
        length: 42,
        required: true,
    },
    numberOfInputNotes: {
        type: Number,
        size: {
            min: 1,
        },
    },
    transactions: transactionsType.isRequired,
});
