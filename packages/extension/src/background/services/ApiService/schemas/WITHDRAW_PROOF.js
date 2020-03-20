import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';
import inputAmountType from './types/inputAmount';
import noteHashType from './types/noteHash';

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
    inputNoteHashes: {
        type: 'array',
        each: noteHashType,
    },
    returnProof: {
        type: 'boolean',
    },
    sender: addressType,
});
