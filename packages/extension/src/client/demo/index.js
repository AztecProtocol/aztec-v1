import {
    log,
    warnLog,
    errorLog,
} from '~utils/log';
import Web3Service from '../services/Web3Service';
import createNewAsset from './createNewAsset';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async function demo() {
    const { aztec } = window;

    try {
        await aztec.enable();
        // await aztec.auth.registerExtension({ password: 'test', salt: 'aaa' });
        // await aztec.auth.login({ password: 'test' });


        const {
            address: userAddress,
        } = Web3Service.account;

        const registerResponse = await aztec.auth.registerAddress(userAddress);
        if (!registerResponse || registerResponse.error) {
            log('Failed to register account.', registerResponse);
            return;
        }
        log('Account registered!', registerResponse.account);


        let zkAssetAddress = '0xef23ae032d5b12f110b273c446b3f37362f89be7'; // ADD EXISTING ASSET ADDRESS HERE
        let enableAssetResponse;
        if (zkAssetAddress) {
            enableAssetResponse = await aztec.auth.enableAsset(zkAssetAddress);
            if (enableAssetResponse.error) {
                log('Failed to enable existing asset.', enableAssetResponse.error);
            }
        }
        if (!enableAssetResponse || enableAssetResponse.error) {
            log('Creating new asset...');
            ({
                zkAssetAddress,
            } = await createNewAsset());
            log('New asset created!');
            warnLog(
                'Add this address to demo file to prevent creating new contracts:',
                zkAssetAddress,
            );
            enableAssetResponse = await aztec.auth.enableAsset(zkAssetAddress);
        }
        if (!enableAssetResponse || enableAssetResponse.error) {
            log('Failed to enable asset.', enableAssetResponse);
            return;
        }
        log('Asset enabled!', enableAssetResponse.asset);


        let asset = await aztec.asset(zkAssetAddress);
        if (!asset.isValid()) {
            await sleep(2000);
            asset = await aztec.asset(zkAssetAddress);
        }
        log(asset);
        if (!asset.isValid()) {
            log('Asset is not valid.');
            return;
        }

        // const deposit = await asset.deposit({
        //     amount: 50,
        // });
        // console.log(deposit);

        const newNote = await asset.createNoteFromBalance({
            amount: 5,
        });
        log(newNote);

        const note = await aztec.note('0x2153f72cb02058d3e4ac18267731095c2f56fbc17aa58ea709f5628856dbc59e');
        log(note);

        if (!note.isValid()) {
            log('Note is not valid');
            return;
        }

        await note.grantAccess([
            '0x0563a36603911daaB46A3367d59253BaDF500bF9',
        ]);
    } catch (e) {
        errorLog(e);
    }
}
