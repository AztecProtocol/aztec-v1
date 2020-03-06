import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';
import inputAmountType from './types/inputAmount';

export default makeSchema({
    assetAddress: addressType.isRequired,
    amount: inputAmountType
        .withSize({
            gte: 1,
        })
        .isRequired,
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
