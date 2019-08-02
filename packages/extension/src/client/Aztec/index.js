/* eslint-disable import/no-unresolved */
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry';
import ACE from '../../../build/protocol/ACE';
import ZkAssetOwnable from '../../../build/protocol/ZkAssetOwnable';
import ZkAssetMintable from '../../../build/protocol/ZkAssetMintable';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
import ZkAsset from '../../../build/protocol/ZkAsset';
/* eslint-enable */
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
    }

    enable = async ({
        // networkId,
        contractAddresses = {},
    } = {}) => {
        await Web3Service.init();
        Web3Service.registerContract(ACE, {
            contractAddress: contractAddresses.ace,
        });
        Web3Service.registerInterface(ERC20Mintable, {
            name: 'ERC20',
        });
        Web3Service.registerInterface(ZkAsset);
        Web3Service.registerInterface(ZkAssetOwnable);
        Web3Service.registerInterface(ZkAssetMintable);
        Web3Service.registerContract(AZTECAccountRegistry, {
            contractAddress: contractAddresses.aztecAccountRegistry,
        });

        const {
            error,
        } = await ensureExtensionEnabled();

        if (error) {
            this.error = new Error(error);
        } else {
            this.enabled = true;

            this.asset = assetFactory;
            this.note = noteFactory;
        }
    };
}

export default Aztec;
