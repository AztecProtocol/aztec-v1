import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';
import transactionsType from './types/transactions';
import noteHashType from './types/noteHash';

export default makeSchema({
    assetAddress: addressType.isRequired,
    transactions: transactionsType.isRequired,
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
    inputNoteHashes: {
        type: 'array',
        each: noteHashType,
    },
    userAccess: {
        type: 'array',
        each: addressType,
    },
    returnProof: {
        type: 'boolean',
    },
    sender: addressType,
    publicOwner: addressType,
});
