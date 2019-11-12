import ConnectionService from '~ui/services/ConnectionService';
import {
    AZTECAccountRegistryGSNConfig,
} from '~/config/contracts';

export default async function send({
    assetAddress,
    proof,
    // proofId,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.sendTransaction({
        contract: AZTECAccountRegistryGSNConfig.name,
        method: 'confidentialTransferFrom',
        data: [
            assetAddress,
            proofData,
        ],
    });

    return response;
}
