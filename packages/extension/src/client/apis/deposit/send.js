import Web3Service from '~/client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

export default async function sendDeposit({
    proof: depositProof,
    options: {
        assetAddress,
    },
    data: {
        notes,
    },
}) {
    const depositInputOwnerAccounts = [];
    const depositData = depositProof.encodeABI(assetAddress);
    const depositSignatures = depositProof.constructSignatures(
        assetAddress,
        depositInputOwnerAccounts,
    );

    try {
        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialTransfer')
            .send(
                depositData,
                depositSignatures,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialTransfer', {
            asset: assetAddress,
            error,
            notes,
        });
    }

    return notes;
}
