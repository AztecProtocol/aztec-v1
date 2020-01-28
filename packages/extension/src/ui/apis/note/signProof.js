import ConnectionService from '~/ui/services/ConnectionService';

export default async function signProof({
    proofHash,
    sender,
    assetAddress,
}) {
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
