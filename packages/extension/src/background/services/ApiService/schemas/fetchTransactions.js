import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';

export default makeSchema({
    type: {
        type: 'string',
    },
    assetAddress: addressType.isRequired,
    fromBlock: {
        type: 'number',
    },
});
