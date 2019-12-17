import {
    log,
} from '~utils/log';
import Web3Service from '~helpers/Web3Service';

export default async function depositToERC20({
    amount,
    userAddress,
    erc20Address,
}) {
    log(`Minting ERC20 with amount = ${amount}...`);
    const web3Service = await Web3Service();
    await web3Service
        .useContract('ERC20')
        .at(erc20Address)
        .method('mint')
        .send(
            userAddress,
            amount,
        );

    const aceAddress = web3Service.contract('ACE').address;

    log(`Appoving ACE to spend ${amount} from ERC20...`);
    await web3Service
        .useContract('ERC20')
        .at(erc20Address)
        .method('approve')
        .send(
            aceAddress,
            amount,
        );
}
