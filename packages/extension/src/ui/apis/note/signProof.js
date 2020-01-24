import ConnectionService from '~/ui/services/ConnectionService';

export default async function signProof({
    proof,
    sender,
    assetAddress,
}) {
    const {
        signature,
        error,
    } = await ConnectionService.post({
        action: 'metamask.eip712.signProof',
        data: {
            proofHash: proof.hash,
            assetAddress,
            sender,
        },
    });

    if (error) {
        return {
            error,
        };
    }

    return {
        proofHash: proof.hash,
        spender: sender,
        approval: true,
        signature,
    };
}
