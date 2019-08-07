import Web3 from 'web3';
import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import Web3Service from '~client/services/Web3Service';
import createNewAsset from './helpers/createNewAsset';
import sleep from './utils/sleep';

export default async function demoMintable({
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

    let zkAssetAddress = ''; // ADD EXISTING ASSET ADDRESS HERE
    if (!zkAssetAddress) {
        log('Creating new asset...');
        ({
            zkAssetAddress,
        } = await createNewAsset({
            zkAssetType: 'ZkAssetMintable',
            scalingFactor,
        }));

        log('New zk mintable asset created!');
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

    const linkedBalance = await asset.balanceOfLinkedToken();
    log(`Linked ERC20 account balance = ${linkedBalance}.`);


    const mintAmount = randomInt(1, 50);

    log('Generating mint proof...');
    const mintProof = await asset.mint(mintAmount);
    log('Mint proof generated!', mintProof.export());

    log('Minting...');
    const notes = await mintProof.send();
    log(`Successfully minted ${mintAmount}!`, notes);


    await sleep(2000);
    log(`Asset balance = ${await asset.balance()}`);


    const totalSupplyBefore = await asset.totalSupplyOfLinkedToken();
    log(`Total supply of linked token = ${totalSupplyBefore}`);


    const withdrawAmount = randomInt(1, mintAmount);
    log('Generating withdraw proof...');
    const withdrawProof = await asset.withdraw(withdrawAmount, {
        numberOfInputNotes: 1,
    });
    log(withdrawProof.export());

    log('Approving withdrawal...');
    await withdrawProof.approve();
    log('Approved!');

    log('Withdrawing...');
    await withdrawProof.send();
    log(`Successfully withdrew ${withdrawAmount} from asset '${zkAssetAddress}'.`);


    const totalSupplyAfter = await asset.totalSupplyOfLinkedToken();
    log(`Total supply of linked token = ${totalSupplyAfter}`);
}
