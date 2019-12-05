import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';

export default makeSchema({
    assetAddress: addressType.isRequired,
    amount: {
        type: 'integer',
        size: {
            gte: 0,
        },
        required: true,
    },
    owner: addressType.isRequired,
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
