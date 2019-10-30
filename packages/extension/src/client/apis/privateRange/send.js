import devUtils from '@aztec/dev-utils';
import Web3Service from '~/client/services/Web3Service';

const { PRIVATE_RANGE_PROOF } = devUtils.proofs;

export default async function sendPrivateRange({
    proof,
    data: {
        notesSender,
    },
}) {
    try {
        const proofData = proof.encodeABI();

        await Web3Service
            .useContract('ACE')
            .method('validateProof')
            .send(
                PRIVATE_RANGE_PROOF,
                notesSender.address,
                proofData,
            );
    } catch (error) {
        return false;
    }

    return true;
}
