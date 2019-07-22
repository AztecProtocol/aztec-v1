import ACE from '../contracts/ACE';
import ZkAsset from '../contracts/ZkAsset';
import AZTECAccountRegistry from '../contracts/AZTECAccountRegistry';
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
        // TODO get deployed address somehow
        const aceAddress = '0xec85f3d1fc95ca5e02a9e4b08998bd4bf92ef914';
        const aztecAccountRegistryAddress = '0xec85f3d1fc95ca5e02a9e4b08998bd4bf92ef914';

        // this needs to do a session check.
        await Web3Service.init();

        this.enabled = true;
        Web3Service.registerContract(ACE, {
            contractAddress: aceAddress,
        });
        Web3Service.registerContract(AZTECAccountRegistry, {
            contractAddress: aztecAccountRegistryAddress,
        });
        Web3Service.registerInterface(ZkAsset);

        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
