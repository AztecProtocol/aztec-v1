import {
    log,
} from '~utils/log';
import Web3Service from '~client/services/Web3Service';

export default async function depositToERC20({
    amount,
    userAddress,
    erc20Address,
}) {
    log(`Minting ERC20 with amount = ${amount}...`);
    await Web3Service
        .useContract('ERC20')
        .at(erc20Address)
        .method('mint')
        .send(
            userAddress,
            amount,
        );

    const aceAddress = Web3Service.contract('ACE').address;

    log(`Appoving ACE to spend ${amount} from ERC20...`);
    await Web3Service
        .useContract('ERC20')
        .at(erc20Address)
        .method('approve')
        .send(
            aceAddress,
            amount * 5000000,
        );
}
