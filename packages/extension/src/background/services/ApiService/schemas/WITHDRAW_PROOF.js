import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';
import bigNumberType from './types/bigNumber';

export default makeSchema({
    assetAddress: addressType.isRequired,
    amount: bigNumberType
        .withSize({
            gte: 0,
        })
        .isRequired,
    sender: addressType.isRequired,
    to: addressType.isRequired,
    numberOfInputNotes: {
        type: 'integer',
        size: {
            gte: 1,
        },
    },
});
