import makeSchema from '~/utils/makeSchema';
import noteHashType from './types/noteHash';
import addressType from './types/address';

export default makeSchema({
    id: noteHashType.isRequired,
    addresses: {
        type: 'array',
        each: addressType,
        size: {
            gte: 1,
        },
        required: true,
    },
});
