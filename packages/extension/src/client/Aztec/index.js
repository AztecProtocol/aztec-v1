import ACE from '../contracts/ACE';
import ZkAsset from '../contracts/ZkAsset';
import auth from '../auth';
import {
    assetFactory,
} from '../apis/asset';
import {
    noteFactory,
} from '../apis/note';
import Web3Service from '../services/Web3Service';

class Aztec {
    constructor() {
        this.enabled = false;
        this.auth = auth;
    }

    enable = async () => {
        // TODO - check permission
        // get the following data from background
        const account = {
            address: '0x0563a36603911daaB46A3367d59253BaDF500bF9',
        };
        const aceAddress = '0xec85f3d1fc95ca5e02a9e4b08998bd4bf92ef914';

        this.enabled = true;

        Web3Service.init({
            account,
            providerUrl: 'graphql',
        });
        Web3Service.registerContract(ACE, {
            contractAddress: aceAddress,
        });
        Web3Service.registerInterface(ZkAsset);

        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
