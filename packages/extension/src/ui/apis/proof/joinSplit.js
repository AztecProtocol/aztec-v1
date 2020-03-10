import { keccak256 } from 'web3-utils';
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

    return {
        proof,
        proofHash,
        proofData,
    };
}
