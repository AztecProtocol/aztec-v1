import Web3 from 'web3';
import {
    log,
    warnLog,
    errorLog,
} from '~/utils/log';

class Web3Service {
    constructor() {
        this.providerUrl = '';
        this.provider = null;
        this.web3 = null;
        this.eth = null;
        this.contracts = {};
        this.abis = {};
        this.account = null;
        this.networkId = 0;
    }

    reset() {
        this.web3 = null;
        this.eth = null;
        this.contracts = {};
        this.abis = {};
        this.account = null;
        this.networkId = 0;
    }

    async init({
        providerUrl = '',
        contractsConfig,
        account,
    } = {}) {
        let {
            web3,
            provider,
        } = this;
        if (!web3 || providerUrl !== this.providerUrl) {
            if (providerUrl) {
                if (providerUrl.match(/^wss?:\/\//)) {
                    provider = new Web3.providers.WebsocketProvider(providerUrl);
                } else {
                    provider = new Web3.providers.HttpProvider(providerUrl);
                }
            } else {
                provider = window.ethereum;
            }
            // TODO - to be removed
            // https://metamask.github.io/metamask-docs/API_Reference/Ethereum_Provider#ethereum.autorefreshonnetworkchange-(to-be-removed)
            provider.autoRefreshOnNetworkChange = false;

            if (!provider) {
                errorLog('Provider cannot be empty.');
                return;
            }

            if (typeof provider.enable === 'function') {
                await provider.enable();
            }

            web3 = new Web3(provider);

            this.providerUrl = providerUrl;
            this.provider = provider;
            this.web3 = web3;
            this.eth = web3.eth;
        }

        const networkId = await web3.eth.net.getId();
        this.networkId = networkId || 0;

        if (account) {
            this.account = account;
        } else {
            let [address] = await web3.eth.getAccounts();
            if (!address && typeof provider.enable === 'function') {
                await provider.enable();
                [address] = await web3.eth.getAccounts();
            }
            this.account = {
                address,
            };
        }

        if (contractsConfig) {
            this.registerContractsConfig(contractsConfig);
        }
    }

    registerContract(
        config,
        {
            name = '',
            address = '',
        } = {},
    ) {
        if (!this.web3) {
            return null;
        }

        const contractName = name || config.contractName;

        if (!config.abi) {
            log(`Contract object "${contractName}" doesn't have an abi.`);
            return null;
        }

        let contractAddress = address;
        if (!contractAddress) {
            const lastNetworkId = Object.keys(config.networks).pop();
            const network = config.networks[lastNetworkId];
            contractAddress = network && network.address;
        }
        if (!contractAddress) {
            log(`Contract object "${contractName}" doesn't have an address.
                Please deploy it first or use 'registerInterface' instead.
            `);
            return null;
        }

        this.abis[contractName] = config.abi;

        const contract = new this.web3.eth.Contract(
            config.abi,
            contractAddress,
        );

        contract.address = contract._address; // eslint-disable-line no-underscore-dangle
        this.contracts[contractName] = contract;

        return contract;
    }

    registerInterface(
        config,
        {
            name = '',
        } = {},
    ) {
        if (!this.web3) {
            return null;
        }

        const interfaceName = name || config.contractName;
        this.abis[interfaceName] = config.abi;

        return this.abis[interfaceName];
    }

    registerContractsConfig(contractsConfig) {
        contractsConfig.forEach(({
            name,
            config,
            address,
        }) => {
            if (!address) {
                this.registerInterface(config, {
                    name,
                });
            } else {
                this.registerContract(config, {
                    name,
                    address,
                });
            }
        });
    }

    hasContract(contractName) {
        return !!this.contracts[contractName];
    }

    contract(contractName) {
        if (!this.hasContract(contractName)) {
            log(`Contract object "${contractName}" hasn't been initiated.`);
        }

        return this.contracts[contractName];
    }

    getAddress(contractName) {
        const {
            address,
        } = this.contract(contractName) || {};
        return address;
    }

    deployed(contractName, contractAddress = '') {
        let contract;
        if (!contractAddress) {
            contract = this.contracts[contractName];
        } else if (this.abis[contractName]) {
            contract = new this.web3.eth.Contract(
                this.abis[contractName],
                contractAddress || (this.contracts[contractName] || {}).address,
            );
            const {
                _address: address,
            } = contract;
            contract.address = address;
        }
        if (!contract) {
            log(`'${contractName}' is not registered as a contract.`);
        }

        return contract;
    }

    async sendAsync(args) {
        return new Promise((resolve, reject) => {
            // TODO - may be removed in the future
            // https://metamask.github.io/metamask-docs/API_Reference/Ethereum_Provider#ethereum.sendasync(options%2C-callback)-(deprecated)
            this.web3.givenProvider.sendAsync(args, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    }

    async deploy(config, constructorArguments = []) {
        const {
            abi,
            bytecode,
        } = config;

        const contractObj = new this.web3.eth.Contract(abi);
        contractObj.options.data = bytecode;
        const deployOptions = {
            data: bytecode,
            arguments: constructorArguments,
        };

        const { address } = this.account;
        const gas = await contractObj.deploy(deployOptions).estimateGas();

        return new Promise((resolve, reject) => {
            contractObj
                .deploy(deployOptions)
                .send({
                    from: address,
                    gas: parseInt(gas * 1.1, 10),
                })
                .once('transactionHash', (receipt) => {
                    const interval = setInterval(() => {
                        this.web3.eth.getTransactionReceipt(receipt, (
                            error,
                            transactionReceipt,
                        ) => {
                            if (transactionReceipt) {
                                clearInterval(interval);

                                const {
                                    contractAddress,
                                } = transactionReceipt;
                                const contract = new this.web3.eth.Contract(
                                    abi,
                                    contractAddress,
                                );
                                contract.address = contractAddress;
                                resolve(contract);
                            } else if (error) {
                                clearInterval(interval);
                                reject(new Error(error));
                            }
                        });
                    }, 1000);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    triggerMethod = async (type, {
        method,
        fromAddress,
        args,
        web3 = this.web3,
        gasPrice,
    }) => {
        const methodSetting = (args.length
            && typeof args[args.length - 1] === 'object'
            && !Array.isArray(args[args.length - 1])
            && args[args.length - 1])
            || null;
        const methodArgs = methodSetting
            ? args.slice(0, args.length - 1)
            : args;

        const estimatedGas = await method(...methodArgs).estimateGas({
            from: fromAddress,
            ...methodSetting,
        });

        if (type === 'call') {
            return method(...methodArgs).call({
                from: fromAddress,
                ...methodSetting,
                gas: estimatedGas,
                gasPrice,
            });
        }

        return new Promise(async (resolve, reject) => {
            const options = {
                from: fromAddress,
                ...methodSetting,
                gasPrice,
                gas: estimatedGas,
            };

            method(...methodArgs)
                .send(options)
                .on('transactionHash', (receipt) => {
                    const interval = setInterval(() => {
                        web3.eth.getTransactionReceipt(receipt, (
                            error,
                            transactionReceipt,
                        ) => {
                            if (transactionReceipt) {
                                clearInterval(interval);
                                resolve(transactionReceipt);
                            } else if (error) {
                                clearInterval(interval);
                                reject(new Error(error));
                            }
                        });
                    }, 1000);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    };

    useContract(contractName, contractAddress = null) {
        return {
            method: (methodName) => {
                const contract = this.deployed(contractName, contractAddress);
                if (!contract) {
                    throw new Error(`Cannot call method '${methodName}' of undefined.`);
                }

                const method = contract.methods[methodName];
                if (!method) {
                    throw new Error(`Method '${methodName}' is not defined in contract '${contractName}'.`);
                }

                return {
                    call: async (...args) => this.triggerMethod('call', {
                        method,
                        fromAddress: this.account.address,
                        args,
                    }),
                    send: async (...args) => this.triggerMethod('send', {
                        method,
                        fromAddress: this.account.address,
                        args,
                    }),
                    useGSN: (gsnConfig) => {
                        if (!gsnConfig) {
                            errorLog('Cannot use gsn as "gsnConfig" was not defined');
                            return {};
                        }

                        const {
                            gsnProvider,
                            signingInfo,
                        } = gsnConfig;
                        const web3 = new Web3(gsnProvider);
                        const gsnContract = new web3.eth.Contract(
                            this.abis[contractName],
                            contractAddress || this.getAddress(contractName),
                        );

                        gsnContract.setProvider(gsnProvider);

                        return {
                            send: async (...args) => {
                                let gasPrice;
                                try {
                                    gasPrice = await web3.eth.getGasPrice();
                                } catch (e) {
                                    errorLog(e);
                                }
                                return this.triggerMethod('send', {
                                    method: gsnContract.methods[methodName],
                                    fromAddress: signingInfo.address,
                                    args,
                                    gasPrice: gasPrice ? gasPrice * 1 : 18000000000, // set gas price 100% higher than last few blocks median to ensure we get in the block
                                    web3,
                                });
                            },
                        };
                    },
                };
            },
            events: (eventName) => {
                const contract = this.deployed(contractName, contractAddress);
                if (!contract) {
                    throw new Error(`Cannot call waitForEvent('${eventName}') of undefined.`);
                }
                return {
                    where: async ({
                        filter = {},
                        fromBlock = 1,
                        toBlock = 'latest',
                    }) => contract.getPastEvents(eventName, {
                        filter,
                        fromBlock,
                        toBlock,
                    }),
                    all: async () => contract.getPastEvents('allEvents', {
                        fromBlock: 0,
                    }),
                    subscribe: (
                        options = { filter: {}, fromBlock: 1 },
                        callback,
                    ) => contract.events[eventName]({
                        filter: options.filter,
                        fromBlock: options.fromBlock,
                    }, callback),
                    subscribeAll: (
                        options = { filter: {}, fromBlock: 1 },
                        callback,
                    ) => contract.events.allEvents({
                        filter: options.filter,
                        fromBlock: options.fromBlock,
                    }, callback),
                };
            },
            at: (address) => {
                if (!address) {
                    throw new Error(`'address' cannot be empty in useContract(${contractName}).at(address)`);
                }
                if (!this.abis[contractName]) {
                    warnLog(`'${contractName}' is not registered as an interface.`);
                }
                return this.useContract(contractName, address);
            },
        };
    }
}

export default Web3Service;
