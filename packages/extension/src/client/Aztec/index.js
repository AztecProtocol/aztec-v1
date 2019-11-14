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
import {
    connectionRequestEvent,
    connectionApprovedEvent,
    actionEvent,
    uiOpenEvent,
    uiCloseEvent,
} from '~config/event';
import Web3Service from '~/client/services/Web3Service';
import ApiError from '~client/utils/ApiError';
/* eslint-disable import/no-unresolved */
import ZkAsset from '../../../build/protocol/ZkAsset';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
/* eslint-enable */
import getSiteData from '../utils/getSiteData';
import assetFactory from '../apis/assetFactory';
import noteFactory from '../apis/noteFactory';
import {
    ensureExtensionInstalled,
    ensureDomainRegistered,
} from '../auth';
import MetaMaskService from '../services/MetaMaskService';
import backgroundFrame from './backgroundFrame';

const clientContracts = [
    'ACE',
    'AZTECAccountRegistry',
];

class Aztec {
    constructor() {
        this.enabled = false;
        this.clientId = randomId();
        this.bindAccountDetectors();
    }

    bindAccountDetectors() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async () => {
                if (!this.enabled) return;
                await this.enable();
            });

            window.ethereum.on('networkChanged', async () => {
                if (!this.enabled) return;
                await this.enable();
            });
        }
        // TODO - other providers
    }

    query = async (data) => {
        const requestId = randomId();
        const {
            args = {},
        } = data || {};
        this.port.postMessage({
            ...data,
            args: {
                ...args,
                site: getSiteData(),
            },
            clientId: this.clientId,
            requestId,
            domain: window.location.origin,
            sender: 'WEB_CLIENT',
        });
        return filterStream('CLIENT_RESPONSE', requestId, this.MessageSubject.asObservable());
    }

    setupStreams = ({ ports }) => {
        // here we need to enable the subscription to await metamask actions from the extension
        this.MessageSubject = new Subject();
        this.messages$ = this.MessageSubject.asObservable();
        [this.port] = ports;
        this.port.onmessage = ({ data }) => {
            if (data.data.type === uiOpenEvent) {
                backgroundFrame.open();
                return;
            }
            if (data.data.type === uiCloseEvent) {
                backgroundFrame.close();
                return;
            }
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
        providerUrl = 'ws://localhost:8545',
        contractAddresses = {
            ACE: '',
            AZTECAccountRegistry: '',
        },
    } = {}) => {
        await Web3Service.init({
            provider: window.ethereum,
        });

        const {
            networkId,
            account,
        } = Web3Service;

        const frame = await backgroundFrame.init();

        const backgroundResponse = fromEvent(window, 'message')
            .pipe(
                filter(({ data }) => data.type === connectionApprovedEvent),
                tap(this.setupStreams),
                take(1),
            ).toPromise();

        // ensure there is an open channel / port we can communicate on
        frame.contentWindow.postMessage({
            type: connectionRequestEvent,
            requestId: randomId(),
            clientId: this.clientId,
            sender: 'WEB_CLIENT',
            data: {
                providerUrl,
                contractAddresses,
                networkId,
                currentAddress: account.address,
            },
        }, '*');

        const {
            data: {
                response: {
                    contractsConfigs,
                } = {},
            },
        } = await backgroundResponse;

        const {
            error: registerExtensionError,
        } = await ensureExtensionInstalled();
        if (registerExtensionError) {
            throw new Error(registerExtensionError);
        }

        const {
            error: ensureDomainRegisteredError,
        } = await ensureDomainRegistered();
        if (ensureDomainRegisteredError) {
            throw new Error(ensureDomainRegisteredError);
        }

        contractsConfigs
            .filter(({ config }) => clientContracts.indexOf(config.contractName) >= 0)
            .forEach(({
                config,
                address,
            }) => {
                if (!address) {
                    throw new ApiError('input.contract.address.empty', {
                        messageOptions: {
                            contractName: config.contractName,
                        },
                        networkId,
                        contractName: config.contractName,
                    });
                }
                Web3Service.registerContract(config, {
                    address,
                });
            });
        Web3Service.registerInterface(ERC20Mintable, {
            name: 'ERC20',
        });
        Web3Service.registerInterface(ZkAsset, {
            name: 'ZkAsset',
        });

        this.asset = assetFactory;
        this.note = noteFactory;

        const availableWeb3Apis = [
            'useContract',
            'getAddress',
            'deploy',
        ];
        this.web3 = {
            account: () => ({
                ...Web3Service.account,
            }),
        };
        availableWeb3Apis.forEach((name) => {
            this.web3[name] = (...args) => Web3Service[name](...args);
        });

        this.enabled = true;
    };
}

export default Aztec;
