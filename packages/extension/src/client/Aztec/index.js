/* eslint-disable import/no-unresolved */
import {
    mergeMap,
    map,
    filter,
    tap,
} from 'rxjs/operators';
import {
    Subject,
    from,
} from 'rxjs';
import {
    AZTECAccountRegistryConfig,
    ACEConfig,
    IZkAssetConfig,
} from '~/config/contracts';


import ZkAssetMintable from '../../../build/protocol/ZkAssetMintable';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
import {
    actionEvent,
} from '~config/event';
/* eslint-enable */
import assetFactory from '../apis/assetFactory';
import noteFactory from '../apis/noteFactory';
import { ensureExtensionInstalled, ensureDomainRegistered } from '../auth';
import Web3Service from '../services/Web3Service';
import MetaMaskService from '../services/MetaMaskService';


class Aztec {
    constructor() {
        this.enabled = false;
        window.ethereum.on('accountsChanged', async () => {
            if (!this.enabled) return;
            // Time to reload your interface with accounts[0]!
            await this.enable();
        });

        window.ethereum.on('networkChanged', async (networkId) => {
            if (!this.enabled) return;
            await this.enable();
        });
        this.setupStreams();
    }

    setupStreams() {
        // here we need to enable the subscription to await metamask actions from the extension
        this.contentScriptSubject = new Subject();
        this.contentScript$ = this.contentScriptSubject.asObservable();

        window.addEventListener('message', (data) => {
            this.contentScriptSubject.next(data);
        });

        this.contentScript$.pipe(
            filter(({ data: { type } }) => type === actionEvent),
            mergeMap(data => from(MetaMaskService(data))),
            tap(data => window.postMessage({
                type: 'ACTION_RESPONSE',
                requestId: data.requestId,
                response: {
                    ...data.response,
                },
            }, '*')),
            // respond to content script
        ).subscribe();
    }

    enable = async ({
        // networkId,
        contractAddresses = {},
    } = {}) => {
        if (!this.contractAddresses) {
            this.contractAddresses = contractAddresses;
        }
        await Web3Service.init();

        const networkId = window.ethereum.networkVersion;
        // console.log(`enabled with networkId: ${networkId}`);
        const {
            config: accountRegistryContract,
            networks: accountRegistryNetworks,
        } = AZTECAccountRegistryConfig;
        const accountRegistryAddress = this.contractAddresses.aztecAccountRegistry
            || accountRegistryNetworks[networkId];

        Web3Service.registerContract(accountRegistryContract, {
            address: accountRegistryAddress,
        });

        const {
            error: registerExtensionError,
        } = await ensureExtensionInstalled();

        if (registerExtensionError) {
            throw new Error(registerExtensionError);
        }

        const {
            error: ensureDomainRegisteredError,
        } = await ensureDomainRegistered();

        this.enabled = true;

        const {
            config: aceContract,
            networks: ACENetworks,
        } = ACEConfig;
        const aceAddress = this.contractAddresses.ace || ACENetworks[networkId];

        Web3Service.registerContract(aceContract, {
            address: aceAddress,
        });
        Web3Service.registerInterface(ERC20Mintable, {
            name: 'ERC20',
        });
        Web3Service.registerInterface(ZkAssetMintable, {
            name: 'ZkAsset',
        });

        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
