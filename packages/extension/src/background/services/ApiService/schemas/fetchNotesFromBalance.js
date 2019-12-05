import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';

export default makeSchema({
    assetAddress: addressType.isRequired,
    equalTo: {
        type: 'integer',
        size: {
            gte: 0,
        },
    },
    greaterThan: {
        type: 'integer',
        size: {
            gte: 0,
        },
    },
    lessThan: {
        type: 'integer',
        size: {
            gte: 0,
        },
    },
    numberOfNotes: {
        type: 'integer',
        size: {
            gte: 1,
        },
    },
});
