import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
/* eslint-disable import/no-unresolved */
import ACE from '../../../build/protocol/ACE';
import ZkAssetOwnable from '../../../build/protocol/ZkAssetOwnable';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
/* eslint-enable */
import Web3Service from '../services/Web3Service';
import createNewAsset from './createNewAsset';
import depositToERC20 from './depositToERC20';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async function demo({
    initialERC20Balance = 200,
    epoch = 1,
    category = 1,
    proofId = 1,
    filter = 17,
    scalingFactor = 1,
    canAdjustSupply = true,
    canConvert = true,
} = {}) {
    const { aztec } = window;

    await aztec.enable();
    // await aztec.auth.registerExtension({ password: 'test', salt: 'aaa' });
    // await aztec.auth.login({ password: 'test' });
    Web3Service.registerContract(ACE);
    Web3Service.registerInterface(ERC20Mintable, {
        name: 'ERC20',
    });
    Web3Service.registerInterface(ZkAssetOwnable, {
        name: 'ZkAsset',
    });


    const {
        address: userAddress,
    } = Web3Service.account;

    const registerResponse = await aztec.auth.registerAddress(userAddress);
    if (!registerResponse || registerResponse.error) {
        log('Failed to register account.', registerResponse);
        return;
    }
    log('Account registered!', registerResponse.account);


    let zkAssetAddress = '0x2fc8dcf1dbcf87cc474d2dcd50f5cdb8a7c2fc16'; // ADD EXISTING ASSET ADDRESS HERE
    let enableAssetResponse;
    if (zkAssetAddress) {
        enableAssetResponse = await aztec.auth.enableAsset(zkAssetAddress);
    } else {
        log('Creating new asset...');
        const {
            erc20Address,
            zkAssetAddress: newZkAssetAddress,
        } = await createNewAsset({
            epoch,
            category,
            proofId,
            filter,
            scalingFactor,
            canAdjustSupply,
            canConvert,
        });

        await depositToERC20({
            userAddress,
            amount: initialERC20Balance,
            erc20Address,
        });

        zkAssetAddress = newZkAssetAddress;
        log(
            'New zk asset created!',
            `Linked ERC20 account balance = ${initialERC20Balance}.`,
        );

        warnLog(
            'Add this address to demo file to prevent creating new asset:',
            zkAssetAddress,
        );
        enableAssetResponse = await aztec.auth.enableAsset(zkAssetAddress);
    }
    if (!enableAssetResponse || enableAssetResponse.error) {
        log(
            `Failed to enable asset '${zkAssetAddress}'.`,
            enableAssetResponse.error,
        );
        return;
    }
    log('Asset enabled!', enableAssetResponse.asset);


    let asset = await aztec.asset(zkAssetAddress);
    if (!asset.isValid()) {
        // TODO
        // wait for data to be processed by graph node
        // this should be handled in background script
        await sleep(2000);
        asset = await aztec.asset(zkAssetAddress);
    }
    log(asset);
    if (!asset.isValid()) {
        log('Asset is not valid.');
        return;
    }

    log(`Asset balance = ${asset.balance}`);


    const depositAmount = randomInt(1, 50);

    let erc20Balance = await asset.balanceOfLinkedToken();
    if (erc20Balance < depositAmount) {
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
        log('Failed to generate deposit proof');
        return;
    }
    log(depositProof.export());

    log('Making deposit...');
    const incomeNotes = await depositProof.send();
    if (!incomeNotes) {
        log('Failed to deposit');
        return;
    }
    log(`Successfully deposited ${depositAmount} to asset '${zkAssetAddress}'.`, {
        notes: incomeNotes,
    });


    await sleep(1000);
    await asset.refresh();
    log(`Asset balance = ${asset.balance}`);


    // const newNoteProof = await asset.createNoteFromBalance({
    //     amount: 5,
    // });
    // if (!newNoteProof) {
    //     log('Failed to generate proof for creating note from balance');
    //     return;
    // }
    // log(newNoteProof.export());
    // if (newNoteProof) return;

    // const note = await aztec.note('0x2153f72cb02058d3e4ac18267731095c2f56fbc17aa58ea709f5628856dbc59e');
    // log(note);
    //
    // if (!note.isValid()) {
    //     log('Note is not valid');
    //     return;
    // }
    //
    // await note.grantAccess([
    //     '0x0563a36603911daaB46A3367d59253BaDF500bF9',
    // ]);
}
