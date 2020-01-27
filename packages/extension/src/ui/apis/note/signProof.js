import { keccak256 } from 'web3-utils';
import ConnectionService from '~/ui/services/ConnectionService';

export default async function signProof({
    proof,
    sender,
    assetAddress,
}) {
    const proofHash = keccak256(proof.eth.outputs);

    const {
        signature,
        error,
    } = await ConnectionService.post({
        action: 'metamask.eip712.signProof',
        data: {
            proofHash,
            assetAddress,
            spender: sender,
            approval: true,
        },
    });

    if (error) {
        return {
            error,
        };
    }

    return {
        proofHash,
        spender: sender,
        approval: true,
        signature,
    };
}
