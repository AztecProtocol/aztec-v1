import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';
import inputAmountType from './types/inputAmount';

export default makeSchema({
    assetAddress: addressType.isRequired,
    amount: inputAmountType.isRequired,
    to: addressType.isRequired,
    publicOwner: addressType.isRequired,
    numberOfInputNotes: {
        type: 'integer',
        size: {
            gte: 1,
        },
    },
    returnProof: {
        type: 'boolean',
    },
    sender: addressType,
});
