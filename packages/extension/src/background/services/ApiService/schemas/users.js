import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';

export default makeSchema({
    where: {
        type: 'object',
        required: true,
        property: {
            address_in: {
                type: 'array',
                each: addressType.isRequired,
            },
        },
    },
});
