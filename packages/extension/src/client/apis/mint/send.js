import devUtils from '@aztec/dev-utils';
import Web3Service from '~/client/services/Web3Service';
import ContractError from '~/client/utils/ContractError';

const { MINT_PROOF } = devUtils.proofs;

export default async function sendMint({
    proof,
    options: {
        assetAddress,
    },
    data: {
        outputNotes,
    },
}) {
    try {
        const proofData = proof.encodeABI();

        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialMint')
            .send(
                MINT_PROOF,
                proofData,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialMint', {
            error,
        });
    }

    return outputNotes;
}
