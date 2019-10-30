import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import Web3Service from '~/client/services/Web3Service';
import createNewAsset from './helpers/createNewAsset';
import depositToERC20 from './helpers/depositToERC20';
import sleep from './utils/sleep';
import deposit from './tasks/deposit';

export default async function demoBurnable({
    initialERC20Balance = 200,
    scalingFactor = 1,
} = {}) {
    const { aztec } = window;
    await aztec.enable();

    const {
        address: userAddress,
    } = Web3Service.account;


    let zkAssetAddress = '0xB9664917C22dF160FF7866e2e3726e75fdB2DDCa'; // ADD EXISTING ASSET ADDRESS HERE
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
    log(asset);
    if (!asset.isValid()) {
        log('Asset is not valid.');
        return;
    }

    const logBalances = async () => {
        await sleep(1000);
        log(`Asset balance = ${await asset.balance()}.`);

        const totalSupply = await asset.totalSupplyOfLinkedToken();
        log(`Total supply of linked token = ${totalSupply}.`);

        const linkedBalance = await asset.balanceOfLinkedToken();
        log(`Linked ERC20 account balance = ${linkedBalance}.`);
    };


    await logBalances();


    const burnAmount = randomInt(1, 50);
    const depositedNotes = await deposit(asset, burnAmount);


    await logBalances();


    log('Generating burn proof...');
    const burnProof = await asset.burn(depositedNotes);
    log('Burn proof generated!', burnProof.export());

    log('Burning...');
    const burnedNotes = await burnProof.send();
    log(`Successfully burned ${burnAmount}!`, burnedNotes);


    await logBalances();
}
