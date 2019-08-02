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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async function demoOwnable({
    initialERC20Balance = 200,
    scalingFactor = 1,
} = {}) {
    const { aztec } = window;

    await aztec.enable();

    const {
        address: userAddress,
    } = Web3Service.account;


    let zkAssetAddress = ''; // ADD EXISTING ASSET ADDRESS HERE
    if (!zkAssetAddress) {
        log('Creating new asset...');
        const {
            erc20Address,
            zkAssetAddress: newZkAssetAddress,
        } = await createNewAsset({
            zkAssetType: 'ZkAssetMintable',
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
    if (!asset.isValid()) {
        // TODO
        // wait for data to be processed by graph node
        // this should be handled in background script
        await sleep(2000);
        await asset.refresh();
    }
    log(asset);
    if (!asset.isValid()) {
        log('Asset is not valid.');
        return;
    }

    log(`Asset balance = ${await asset.balance()}`);


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

    log('Generating deposit proof...');
    const depositProof = await asset.deposit(depositAmount);
    if (!depositProof) {
        log('Failed to generate deposit proof.');
        return;
    }
    log(depositProof.export());

    log('Approving deposit...');
    await depositProof.approve();
    log('Approved!');

    log('Making deposit...');
    const incomeNotes = await depositProof.send();
    if (!incomeNotes) {
        log('Failed to deposit.');
        return;
    }
    log(`Successfully deposited ${depositAmount} to asset '${zkAssetAddress}'.`, {
        notes: incomeNotes,
    });


    await sleep(1000);
    log(`Asset balance = ${await asset.balance()}`);


    const withdrawAmount = randomInt(1, 10);
    log('Generating withdraw proof...');
    const withdrawProof = await asset.withdraw(withdrawAmount, {
        numberOfInputNotes: 1,
    });
    if (!withdrawProof) {
        log('Failed to generate withdraw proof');
        return;
    }
    log(withdrawProof.export());

    log('Approving withdrawal...');
    await withdrawProof.approve();
    log('Approved!');

    log('Withdrawing...');
    await withdrawProof.send();
    log(`Successfully withdrew ${withdrawAmount} from asset '${zkAssetAddress}'.`);


    await sleep(1000);
    log(`Asset balance = ${await asset.balance()}`);


    const sendAmount = 1;
    const receiver = '0x0563a36603911daaB46A3367d59253BaDF500bF9';

    log('Generating send proof...');
    const sendProof = await asset.send({
        amount: sendAmount,
        to: receiver,
        numberOfOutputNotes: 1,
    });
    log(sendProof.export());

    log('Approving send proof...');
    await sendProof.approve();
    log('Approved!');

    log('Sending...');
    await sendProof.send();
    log(`Successfully sent ${sendAmount} to account '${receiver}'.`);

    await sleep(1000);
    log(`Asset balance = ${await asset.balance()}`);
}
