import Schema from 'validate';
import transactionsType from './types/transactions';

export default new Schema({
    assetAddress: {
        type: String,
        length: 42,
        required: true,
    },
    from: {
        type: String,
        length: 42,
        required: true,
    },
    sender: {
        type: String,
        length: 42,
        required: true,
    },
    numberOfOutputNotes: {
        type: Number,
        size: {
            min: 1,
        },
    },
    transactions: transactionsType.isRequired,
});
