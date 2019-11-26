import Schema from 'validate';
import addressType from './types/address';

export default new Schema({
    assetAddress: addressType.isRequired,
    owner: addressType.isRequired,
    equalTo: {
        type: Number,
        size: {
            min: 0,
        },
    },
    greaterThan: {
        type: Number,
        size: {
            min: 0,
        },
    },
    lessThan: {
        type: Number,
        size: {
            min: 0,
        },
    },
    numberOfNotes: {
        type: Number,
        size: {
            min: 1,
        },
    },
    allowLessNumberOfNotes: {
        type: Boolean,
    },
});
