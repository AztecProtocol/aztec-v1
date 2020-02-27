import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';

export default makeSchema({
    address: addressType.isRequired,
    message: {
        type: 'string',
        required: true,
    },
});
