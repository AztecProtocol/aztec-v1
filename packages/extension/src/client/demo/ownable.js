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
    const { aztec } = window;
    await aztec.enable();

    const {
        address: userAddress,
    } = Web3Service.account;


    let zkAssetAddress = '0x2baEFf6946CD6904Da9387FcF56169058fFE5Bf6'; // ADD EXISTING ASSET ADDRESS HERE
    if (!zkAssetAddress) {
        log('Creating new asset...');
        const {
            erc20Address,
            zkAssetAddress: newZkAssetAddress,
        } = await createNewAsset({
            zkAssetType: 'ZkAssetOwnable',
            scalingFactor,
        });

        await depositToERC20({
            userAddress,
            amount: initialERC20Balance,
            erc20Address,
        });

        zkAssetAddress = newZkAssetAddress;
        log(
            'New zk asset created!',
            'Asset balance = 0',
            `Linked ERC20 account balance = ${initialERC20Balance}.`,
        );

        warnLog(
            'Add this address to demo file to prevent creating new asset:',
            zkAssetAddress,
        );
    }


    const asset = await aztec.asset(zkAssetAddress);
    log(asset);
    if (!asset.isValid()) {
        log('Asset is not valid.');
        return;
    }

    const logBalance = async () => {
        await sleep(1000);
        log(`Asset balance = ${await asset.balance()}`);
    };


    await logBalance();


    const depositAmount = randomInt(1, 50);

    let erc20Balance = await asset.balanceOfLinkedToken();
    if (erc20Balance >= depositAmount) {
        log(`ERC20 account balance = ${erc20Balance}`);
    } else {
        log(`ERC20 balance (${erc20Balance}) is not enough to make a deposit of ${depositAmount}.`);

        log('Sending free token...', {
            userAddress,
            amount: depositAmount,
        });

        await depositToERC20({
            userAddress,
            amount: depositAmount,
            erc20Address: asset.linkedTokenAddress,
        });

        erc20Balance = await asset.balanceOfLinkedToken();
        log(`Your new ERC20 account balance is ${erc20Balance}.`);
    }


    await deposit(asset, depositAmount);


    await logBalance();


    // const withdrawAmount = randomInt(1, 10);
    // await withdraw(asset, withdrawAmount);


    // await logBalance();


    // const sendAmount = 1;
    // const receiver = '0x0563a36603911daaB46A3367d59253BaDF500bF9';
    // await send(asset, sendAmount, receiver);


    await logBalance();
}
