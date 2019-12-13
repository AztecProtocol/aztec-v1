import Web3Service from '~/helpers/Web3Service';

export default async function approveERC20Allowance({
    asset,
    amount,
    allowanceSpender,
}) {
    const {
        linkedTokenAddress,
    } = asset;

    let error;
    try {
        await Web3Service
            .useContract('ERC20')
            .at(linkedTokenAddress)
            .method('approve')
            .send(
                allowanceSpender,
                amount,
            );
    } catch (e) {
        error = e;
    }

    return {
        approvedERC20Allowance: error ? 0 : amount,
        error,
    };
}
