import Web3Service from '../services/Web3Service';

export default async function depositToERC20({
    amount,
    userAddress,
    erc20Address,
}) {
    await Web3Service
        .useContract('ERC20')
        .at(erc20Address)
        .method('mint')
        .send(
            userAddress,
            amount,
        );

    const aceAddress = Web3Service.contract('ACE').address;

    await Web3Service
        .useContract('ERC20')
        .at(erc20Address)
        .method('approve')
        .send(
            aceAddress,
            amount,
        );
}
