import devUtils from '@aztec/dev-utils';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

const { JOIN_SPLIT_PROOF } = devUtils.proofs;

export default async function sendCreateNoteFromBalance({
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
                JOIN_SPLIT_PROOF,
                inputNotesOwner.address,
                transferData,
            );
    } catch (error) {
        throw new ContractError('ace.validateProof', {
            type: 'JOIN_SPLIT',
            error,
        });
    }

    try {
        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialTransferFrom')
            .send(
                JOIN_SPLIT_PROOF,
                proof.eth.output,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialTransferFrom', {
            error,
        });
    }

    return outputNotes;
}
