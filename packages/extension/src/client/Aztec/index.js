import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry';
import ACE from '../contracts/ACE';
import ZkAsset from '../contracts/ZkAsset';
import auth from '../auth';
import {
    assetFactory,
} from './asset';
import {
    noteFactory,
} from '../apis/note';

import ensureExtensionEnabled from '../auth';

import Web3Service from '../services/Web3Service';

class Aztec {
    constructor() {
        this.enabled = false;
        this.auth = auth;
    }

    enable = async ({
        // networkId,
        contractAddresses,
    } = {
        contractAddresses: {
            // ace: '0xec85f3d1fc95ca5e02a9e4b08998bd4bf92ef914',
            // aztecAccountRegistry: '0x2DC7d67896DB3D58d029a747e149F68165cE863E',
        },
    }) => {
        await Web3Service.init();
        Web3Service.registerContract(ACE);

        Web3Service.registerContract(AZTECAccountRegistry);

        Web3Service.registerInterface(ZkAsset);
        const {
            address,
        } = Web3Service.account;

        const {
            error,
            account: user,
        } = await ensureExtensionEnabled();

        if (error) {
            console.log(error);
            this.error = new Error(error);
        } else {
            this.enabled = true;

            this.asset = assetFactory;
            this.note = noteFactory;
        }
    };
}

export default Aztec;
