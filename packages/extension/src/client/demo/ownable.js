import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import Web3Service from '../services/Web3Service';
import createNewAsset from './helpers/createNewAsset';
import depositToERC20 from './helpers/depositToERC20';
import sleep from './utils/sleep';
import deposit from './tasks/deposit';
import withdraw from './tasks/withdraw';
import send from './tasks/send';

export default async function demoOwnable({
    initialERC20Balance = 200,
    scalingFactor = 1,
} = {}) {

    // const depositAmount = randomInt(1, 50);

    // let erc20Balance = await asset.balanceOfLinkedToken();
    // if (erc20Balance >= depositAmount) {
    //     log(`ERC20 account balance = ${erc20Balance}`);
    // } else {
    //     log(`ERC20 balance (${erc20Balance}) is not enough to make a deposit of ${depositAmount}.`);

    //     log('Sending free token...', {
    //         userAddress,
    //         amount: depositAmount,
    //     });

    //     await depositToERC20({
    //         userAddress,
    //         amount: depositAmount,
    //         erc20Address: asset.linkedTokenAddress,
    //     });

    //     erc20Balance = await asset.balanceOfLinkedToken();
    //     log(`Your new ERC20 account balance is ${erc20Balance}.`);
    // }


    // await deposit(asset, [{
    //     amount: depositAmount,
    //     to: userAddress,
    // }], {
    //     from: userAddress,
    //     sender: userAddress,
    // });


    // await logBalance();


    // const withdrawAmount = randomInt(1, 10);
    // await withdraw(asset, withdrawAmount, {
    //     sender: userAddress,
    //     from: userAddress,
    //     to: userAddress,
    // });


    // await logBalance();


    // const sendAmount = randomInt(1, 10);
    // await send(asset, [{
    //     amount: sendAmount,
    //     to: userAddress,
    // }], {
    //     from: userAddress,
    //     sender: userAddress,

    // });


    // await logBalance();
}
