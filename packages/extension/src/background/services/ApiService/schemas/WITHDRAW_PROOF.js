import Schema from 'validate';
import addressType from './types/address';

export default new Schema({
    assetAddress: addressType.isRequired,
    amount: {
        type: Number,
        size: {
            min: 0,
        },
    },
    sender: addressType.isRequired,
    to: addressType.isRequired,
    numberOfInputNotes: {
        type: Number,
        size: {
            min: 1,
        },
    },
});
