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

    enable = async ({
        networkId,
        contractAddresses: {
            ace,
            aztecAccountRegistry,
        },

    } = {
        contractAddresses: {

            ace: '0xec85f3d1fc95ca5e02a9e4b08998bd4bf92ef914',
            aztecAccountRegistry: '0x2DC7d67896DB3D58d029a747e149F68165cE863E',
        },
    }) => {
        await Web3Service.init();

        // this should be done through extension's ui
        const {
            address,
        } = Web3Service.account;
        await this.auth.registerAddress(address);

        this.enabled = true;

        // we should enable the extension API under the following conditions
        // if the user has an account and the site has a valid session we should return the API
        // if the user does not have an account


        Web3Service.registerContract(ACE, {
            contractAddress: ace,
        });

        Web3Service.registerContract(AZTECAccountRegistry, {
            contractAddress: aztecAccountRegistry,
        });

        Web3Service.registerInterface(ZkAsset);
        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
