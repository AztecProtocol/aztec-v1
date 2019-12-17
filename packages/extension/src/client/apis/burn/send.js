import devUtils from '@aztec/dev-utils';
import Web3Service from '~/client/services/Web3Service';
import ContractError from '~/client/utils/ContractError';

const { BURN_PROOF } = devUtils.proofs;

export default async function sendBurn({
    proof,
    options: {
        assetAddress,
    },
    data: {
        inputNotes,
    },
}) {
    try {
        const proofData = proof.encodeABI(assetAddress);

        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialBurn')
            .send(
                BURN_PROOF,
                proofData,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialBurn', {
            error,
        });
    }

    return inputNotes;
}
