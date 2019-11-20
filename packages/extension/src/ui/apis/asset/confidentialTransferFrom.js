import ConnectionService from '~ui/services/ConnectionService';
import {
    AZTECAccountRegistryGSN,
} from '~/config/contracts';

export default async function confidentialTransferFrom({
    assetAddress,
    proof,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.sendTransaction({
        contract: AZTECAccountRegistryGSN.name,
        method: 'confidentialTransferFrom',
        data: [
            assetAddress,
            proofData,
        ],
    });

    return response;
}
