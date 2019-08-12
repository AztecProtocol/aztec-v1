/* eslint-disable import/no-unresolved */
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry';
import ACE from '../../../build/protocol/ACE';
import ZkAssetOwnable from '../../../build/protocol/ZkAssetOwnable';
import ZkAssetMintable from '../../../build/protocol/ZkAssetMintable';
import ZkAssetBurnable from '../../../build/protocol/ZkAssetBurnable';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
import ZkAsset from '../../../build/protocol/ZkAsset';
/* eslint-enable */
import assetFactory from '../apis/assetFactory';
import noteFactory from '../apis/noteFactory';
import ensureExtensionEnabled from '../auth';
import Web3Service from '../services/Web3Service';

class Aztec {
    constructor() {
        this.enabled = false;
        window.ethereum.on('accountsChanged', async () => {
            // Time to reload your interface with accounts[0]!
            await this.enable();
        });
    }

    enable = async ({
        // networkId,
        contractAddresses = {},
    } = {}) => {
        if (!this.contractAddresses) {
            this.contractAddresses = contractAddresses;
        }
        await Web3Service.init();

        Web3Service.registerContract(AZTECAccountRegistry, {
            address: this.contractAddresses.aztecAccountRegistry,
        });

        const {
            error,
        } = await ensureExtensionEnabled();

        if (error) {
            throw new Error(error);
        }

        this.enabled = true;

        Web3Service.registerContract(ACE, {
            address: this.contractAddresses.ace,
        });
        Web3Service.registerInterface(ERC20Mintable, {
            name: 'ERC20',
        });
        Web3Service.registerInterface(ZkAsset);
        Web3Service.registerInterface(ZkAssetOwnable);
        Web3Service.registerInterface(ZkAssetMintable);
        Web3Service.registerInterface(ZkAssetBurnable);

        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
