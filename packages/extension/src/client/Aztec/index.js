/* eslint-disable import/no-unresolved */
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry';
import ZkAssetTemplate from '../../../build/contracts/ZkAssetTemplate';
import ACE from '../../../build/protocol/ACE';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
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

        /*
            MetaMask: MetaMask will soon stop reloading pages on network change.
            If you rely upon this behavior, add a 'networkChanged' event handler to trigger the reload manually: https://metamask.github.io/metamask-docs/API_Reference/Ethereum_Provider#ethereum.on(eventname%2C-callback)
            Set 'ethereum.autoRefreshOnNetworkChange' to 'false' to silence this warning: https://metamask.github.io/metamask-docs/API_Reference/Ethereum_Provider#ethereum.autorefreshonnetworkchange'
        */
        window.ethereum.autoRefreshOnNetworkChange = false;
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
        Web3Service.registerInterface(ZkAssetTemplate, {
            name: 'ZkAsset',
        });

        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
