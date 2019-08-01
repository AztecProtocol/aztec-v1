import asyncForEach from '~utils/asyncForEach';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

export default async function approveCreateNoteFromBalance({
    options: {
        assetAddress,
    },
    data: {
        inputNotes,
        inputNotesOwner,
    },
}) {
    try {
        await asyncForEach(inputNotes, async ({
            noteHash,
        }) => {
            await Web3Service
                .useContract('ZkAsset')
                .at(assetAddress)
                .method('confidentialApprove')
                .send(
                    noteHash,
                    inputNotesOwner.address,
                    true,
                    '0x',
                );
        });
    } catch (error) {
        throw new ContractError('zkAsset.confidentialApprove', {
            error,
        });
    }

    return true;
}
