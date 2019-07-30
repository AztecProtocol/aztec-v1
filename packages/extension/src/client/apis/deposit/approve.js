import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

export default async function approveDeposit({
    proof: depositProof,
    options: {
        assetAddress,
    },
    data: {
        noteValues,
    },
}) {
    const sum = noteValues.reduce((accum, v) => accum + v, 0);
    try {
        await Web3Service
            .useContract('ACE')
            .method('publicApprove')
            .send(
                assetAddress,
                depositProof.hash,
                sum,
            );
    } catch (error) {
        throw new ContractError('ace.publicApprove', {
            asset: assetAddress,
            amount: sum,
            error,
        });
    }

    return true;
}
