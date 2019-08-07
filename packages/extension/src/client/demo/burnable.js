import Web3 from 'web3';
import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import asyncMap from '~utils/asyncMap';
import Web3Service from '~client/services/Web3Service';
import createNewAsset from './helpers/createNewAsset';
import depositToERC20 from './helpers/depositToERC20';
import sleep from './utils/sleep';

export default async function demoBurnable({
    initialERC20Balance = 200,
    scalingFactor = 1,
    useHttpProvider = true,
} = {}) {
    const { aztec } = window;
    await aztec.enable();

    if (useHttpProvider) {
        Web3Service.init({
            provider: new Web3.providers.HttpProvider('http://localhost:8545'),
        });
    }

    const {
        address: userAddress,
    } = Web3Service.account;


    let zkAssetAddress = ''; // ADD EXISTING ASSET ADDRESS HERE
    if (!zkAssetAddress) {
        log('Creating new asset...');
        const {
            zkAssetAddress: newZkAssetAddress,
            erc20Address,
        } = await createNewAsset({
            zkAssetType: 'ZkAssetBurnable',
            scalingFactor,
        });

        zkAssetAddress = newZkAssetAddress;

        if (initialERC20Balance) {
            await depositToERC20({
                userAddress,
                amount: initialERC20Balance * scalingFactor,
                erc20Address,
            });
        }

        log('New zk burnable asset created!');
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


    log(`Asset balance = ${await asset.balance()}.`);

    const totalSupply = await asset.totalSupplyOfLinkedToken();
    log(`Total supply of linked token = ${totalSupply}.`);

    const linkedBalance = await asset.balanceOfLinkedToken();
    log(`Linked ERC20 account balance = ${linkedBalance}.`);


    const burnAmount = randomInt(1, 50);

    log('Generating deposit proof...');
    const depositProof = await asset.deposit(burnAmount);
    log(depositProof.export());

    log('Approving deposit...');
    await depositProof.approve();
    log('Approved!');

    log('Making deposit...');
    const depositedNotes = await depositProof.send();
    log(`Successfully deposited ${burnAmount} to asset '${zkAssetAddress}'.`, {
        notes: depositedNotes,
    });


    await sleep(2000);
    log(`Asset balance = ${await asset.balance()}.`);

    const totalSupplyBefore = await asset.totalSupplyOfLinkedToken();
    log(`Total supply of linked token = ${totalSupplyBefore}`);

    const linkedBalanceBefore = await asset.balanceOfLinkedToken();
    log(`Linked ERC20 account balance = ${linkedBalanceBefore}.`);


    const notes = await asyncMap(depositedNotes, async note => note.export());

    log('Generating burn proof...');
    const burnProof = await asset.burn(notes);
    log('Burn proof generated!', burnProof.export());

    log('Burning...');
    const burnedNotes = await burnProof.send();
    log(`Successfully burned ${burnAmount}!`, burnedNotes);


    await sleep(2000);
    log(`Asset balance = ${await asset.balance()}`);

    const totalSupplyAfter = await asset.totalSupplyOfLinkedToken();
    log(`Total supply of linked token = ${totalSupplyAfter}`);

    const linkedBalanceAfter = await asset.balanceOfLinkedToken();
    log(`Linked ERC20 account balance = ${linkedBalanceAfter}.`);
}
