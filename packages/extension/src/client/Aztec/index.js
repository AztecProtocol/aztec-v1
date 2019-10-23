/* eslint-disable import/no-unresolved */
import {
    mergeMap,
    filter,
    tap,
    take,
} from 'rxjs/operators';
import {
    Subject,
    fromEvent,
    from,
} from 'rxjs';
import {
    randomId,
} from '~utils/random';
import filterStream from '~utils/filterStream';
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry';
import ZkAsset from '../../../build/protocol/ZkAsset';
import ACE from '../../../build/protocol/ACE';
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
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async () => {
                if (!this.enabled) return;
                // Time to reload your interface with accounts[0]!
                await this.enable();
            });

            window.ethereum.on('networkChanged', async (networkId) => {
                if (!this.enabled) return;
                await this.enable();
            });
        }
        this.frame = document.getElementById('AZTECSDK').contentWindow;
        this.clientId = randomId();
    }

    query = async (data) => {
        const requestId = randomId();
        this.port.postMessage({
            ...data,
            clientId: this.clientId,
            requestId,
            domain: window.location.origin,
            sender: 'WEB_CLIENT',
        });
        const resp = await filterStream('CLIENT_RESPONSE', requestId, this.MessageSubject.asObservable());
        return resp;
    }

    setupStreams = ({ data, ports, ...rest }) => {
        // here we need to enable the subscription to await metamask actions from the extension
        this.MessageSubject = new Subject();
        this.messages$ = this.MessageSubject.asObservable();
        this.port = ports[0];
        this.port.onmessage = ({ data }) => {
            this.MessageSubject.next({
                ...data,
                data: {
                    type: data.type,
                    ...data.data,
                },
            });
        };

        this.messages$.pipe(
            filter(({ data: { type } }) => type === actionEvent),
            mergeMap(data => from(MetaMaskService(data))),
            tap(data => this.port.postMessage({
                type: 'ACTION_RESPONSE',
                requestId: data.requestId,
                domain: window.location.origin,
                clientId: this.clientId,
                response: {
                    ...data.response,
                },
                sender: 'WEB_CLIENT',
            })),
            // respond to content script
        ).subscribe();
    }

    enable = async ({
        // networkId,
        contractAddresses = {},
    } = {}) => {
        // ensure there is an open channel / port we can communicate on
        this.frame.postMessage({
            type: 'aztec-connection',
            requestId: randomId(),
            clientId: this.clientId,
            sender: 'WEB_CLIENT',
        }, '*');

        await fromEvent(window, 'message')
            .pipe(
                filter(({ data }) => data.type === 'aztec-connection'),
                tap(this.setupStreams),
                take(1),
            ).toPromise();

        // we have an open channel / port so queries will run

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
        } = await ensureExtensionInstalled({
            contractAddresses,
        });
        //  SEND to background script and store contract addresses for network

        if (registerExtensionError) {
            throw new Error(registerExtensionError);
        }
        console.log('___after register');

        const {
            error: ensureDomainRegisteredError,
        } = await ensureDomainRegistered();
        console.log('___after domain');

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
        Web3Service.registerInterface(ZkAsset, {
            name: 'ZkAsset',
        });

        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
