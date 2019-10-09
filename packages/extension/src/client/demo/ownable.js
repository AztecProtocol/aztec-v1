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

    const withdrawAmount = randomInt(1, 10);
    await withdraw(asset, withdrawAmount, {
        sender: userAddress,
        from: userAddress,
        to: userAddress,
    });


    await logBalance();


    const sendAmount = randomInt(1, 10);
    await send(asset, [{
        amount: sendAmount,
        to: userAddress,
    }], {
        from: userAddress,
        sender: userAddress,

    });


    await logBalance();
}
