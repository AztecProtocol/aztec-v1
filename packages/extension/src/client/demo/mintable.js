import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import Web3Service from '~client/services/Web3Service';
/* eslint-disable import/no-unresolved */
import ACE from '../../../build/protocol/ACE';
import ZkAssetOwnable from '../../../build/protocol/ZkAssetOwnable';
import ZkAssetMintable from '../../../build/protocol/ZkAssetMintable';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
/* eslint-enable */
import createNewAsset from './helpers/createNewAsset';
import depositToERC20 from './helpers/depositToERC20';
import sleep from './utils/sleep';

export default async function demoMintable({
    initialERC20Balance = 0,
    scalingFactor = 1,
} = {}) {
    const { aztec } = window;
    await aztec.enable();

    Web3Service.registerContract(ACE);
    Web3Service.registerInterface(ERC20Mintable, {
        name: 'ERC20',
    });
    Web3Service.registerInterface(ZkAssetOwnable, {
        name: 'ZkAsset',
    });
    Web3Service.registerInterface(ZkAssetOwnable);
    Web3Service.registerInterface(ZkAssetMintable);

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
            zkAssetType: 'ZkAssetMintable',
            scalingFactor,
        });

        zkAssetAddress = newZkAssetAddress;

        if (initialERC20Balance) {
            await depositToERC20({
                userAddress,
                amount: initialERC20Balance,
                erc20Address,
            });
        }

        log(
            'New zk mintable asset created!',
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
        // wa\it for data to be processed by graph node
        // this should be handled in background script
        await sleep(2000);
        await asset.refresh();
    }
    log(asset);
    if (!asset.isValid()) {
        log('Asset is not valid.');
        return;
    }


    log(`Asset balance = ${asset.balance}`);


    const mintAmount = randomInt(1, 50);
    log(`Start mint for amount = ${mintAmount}`);

    const mintProof = await asset.mint(mintAmount);
    log('Mint proof generated!', mintProof.export());

    log('Minting...');
    const notes = await mintProof.send();
    log(`Successfully minted ${mintAmount}!`, notes);


    await sleep(2000);
    await asset.refresh();
    log(`Asset balance = ${asset.balance}`);


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
