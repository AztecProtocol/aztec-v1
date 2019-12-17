import devUtils from '@aztec/dev-utils';
import Web3Service from '~/client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

const { SWAP_PROOF } = devUtils.proofs;

export default async function sendSwap({
    proof,
    options: {
        assetAddress,
    },
    data: {
        inputNotesOwner,
        outputNotes,
    },
}) {
    try {
        const transferData = proof.encodeABI(assetAddress);
        await Web3Service
            .useContract('ACE')
            .method('validateProof')
            .send(
                SWAP_PROOF,
                inputNotesOwner.address,
                transferData,
            );
    } catch (error) {
        throw new ContractError('ace.validateProof', {
            type: 'SWAP_PROOF',
            error,
        });
    }

    try {
        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialTransferFrom')
            .send(
                SWAP_PROOF,
                proof.eth.output,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialTransferFrom', {
            error,
        });
    }

    return outputNotes;
}
