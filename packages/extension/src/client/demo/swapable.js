import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import {
    createNote,
} from '~utils/note';
import Web3Service from '../services/Web3Service';
import createNewAsset from './helpers/createNewAsset';
import depositToERC20 from './helpers/depositToERC20';
import deposit from './tasks/deposit';
import withdraw from './tasks/withdraw';
import send from './tasks/send';
import validateAccount from '../apis/utils/validateAccount';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async function demoOwnable({
    initialERC20Balance = 200,
    scalingFactor = 1,
} = {}) {
    // const { aztec } = window;
    // await aztec.enable();

    // const {
    //     address: userAddress,
    // } = Web3Service.account;


    // let zkAssetAddress = ''; // ADD EXISTING ASSET ADDRESS HERE
    // if (!zkAssetAddress) {
    //     log('Creating new asset...');
    //     const {
    //         erc20Address,
    //         zkAssetAddress: newZkAssetAddress,
    //     } = await createNewAsset({
    //         zkAssetType: 'ZkAssetOwnable',
    //         scalingFactor,
    //     });

    //     await depositToERC20({
    //         userAddress,
    //         amount: initialERC20Balance,
    //         erc20Address,
    //     });

    //     zkAssetAddress = newZkAssetAddress;
    //     log(
    //         'New zk asset created!',
    //         'Asset balance = 0',
    //         `Linked ERC20 account balance = ${initialERC20Balance}.`,
    //     );

    //     warnLog(
    //         'Add this address to demo file to prevent creating new asset:',
    //         zkAssetAddress,
    //     );
    // }


    // const asset = await aztec.asset(zkAssetAddress);
    // if (!asset.isValid()) {
    //     // TODO
    //     // wait for data to be processed by graph node
    //     // this should be handled in background script
    //     await sleep(2000);
    //     await asset.refresh();
    // }
    // log(asset);
    // if (!asset.isValid()) {
    //     log('Asset is not valid.');
    //     return;
    // }

    // log(`Asset balance = ${await asset.balance()}`);


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


    // await deposit(asset, depositAmount);


    // await sleep(1000);

    // log(`Asset balance = ${await asset.balance()}`);


    // const swapAmount = 1;
    // log('creating swap notes');

    // const makerBidNoteCreationProof = await asset.createNoteFromBalance(swapAmount);

    // log('approving maker bid notes');
    // await makerBidNoteCreationProof.approve();
    // const [makerBid] = await makerBidNoteCreationProof.send();
    // const takerBidNoteCreationProof = await asset.createNoteFromBalance(swapAmount);
    // log('approving taker bid notes');
    // await takerBidNoteCreationProof.approve();
    // const [takerBid] = await takerBidNoteCreationProof.send();


    // const takerBidNote = await window.aztec.note(takerBidNoteHash); // this exists in a note registry
    // const takerAskNote = await window.aztec.note(takerAskNoteHash); // this will be created

    // // assume we have an asset and test for 1 user swapping two assets with them selves

    // // 1. create bid and ask notes

    // const account = await validateAccount(userAddress, true);
    // const {
    //     spendingPublicKey, address, linkedPublicKey,
    // } = account;

    // console.log({
    //     swapAmount, spendingPublicKey, address, linkedPublicKey,
    // });

    // const makerAsk = await createNote(swapAmount, spendingPublicKey, address, linkedPublicKey);
    // // const takerAsk = await createNote(swapAmount, spendingPublicKey, address, linkedPublicKey);
    // console.log(makerAsk, takerAsk);


    // await asset.swap({
    //     swap: {
    //         makerBid,
    //         takerBid,
    //         takerAsk,
    //         makerAsk,
    //     },
    // }, { sender: userAddress });


    // await sleep(1000);
}
