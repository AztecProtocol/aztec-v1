import { keccak256 } from 'web3-utils';
import {
    valueOf,
} from '~/utils/note';
import {
    recoverJoinSplitProof,
} from '~/utils/transformData';
import ConnectionService from '~/ui/services/ConnectionService';

export default async function joinSplit({
    proofType,
    assetAddress,
    sender,
    publicOwner,
    transactions,
    noteHashes,
    userAccess,
    numberOfInputNotes,
    numberOfOutputNotes,
    amount,
}) {
    const {
        proofData,
    } = await ConnectionService.query({
        query: 'constructProof',
        data: {
            proofType,
            assetAddress,
            transactions,
            numberOfInputNotes,
            numberOfOutputNotes,
            noteHashes,
            userAccess,
            sender,
            publicOwner,
            returnProof: true,
        },
    });

    const proof = await recoverJoinSplitProof(proofData);

    const proofHash = keccak256(proof.eth.outputs);

    const {
        inputNotes,
        outputNotes,
    } = proof;

    let remainderNote;
    const inputAmount = inputNotes
        .reduce((sum, note) => sum + valueOf(note), 0);
    if (inputAmount > amount) {
        remainderNote = outputNotes[outputNotes.length - 1];
    }

    return {
        proof,
        proofHash,
        inputNotes,
        outputNotes,
        remainderNote,
    };
}
