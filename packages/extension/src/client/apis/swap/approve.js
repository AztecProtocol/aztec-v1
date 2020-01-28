import Web3Service from '~/client/services/Web3Service';
import ContractError from '~/client/utils/ContractError';

export default async function approveSwap({
    options: {
        assetAddress,
    },
    data: {
        inputNotes,
        inputNotesOwner,
    },
}) {
    try {
        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialApprove')
            .send(
                inputNotes[0],
                inputNotesOwner.address,
                true,
                '0x',
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialApprove', {
            error,
        });
    }

    return true;
}
