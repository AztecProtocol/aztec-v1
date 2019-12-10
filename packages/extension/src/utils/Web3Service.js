import Web3 from 'web3';
import {
    log,
    warnLog,
    errorLog,
} from '~utils/log';

class Web3Service {
    constructor() {
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
        this.reset();

        let provider;
        if (providerUrl) {
            if (providerUrl.match(/^wss?:\/\//)) {
                provider = new Web3.providers.WebsocketProvider(providerUrl);
            } else {
                provider = new Web3.providers.HttpProvider(providerUrl);
            }
        } else {
            provider = window.ethereum;
        }

        if (!provider) {
            errorLog('Provider cannot be empty.');
            return;
        }

        if (provider
            && typeof provider.enable === 'function'
        ) {
            await provider.enable();
        }

        const web3 = new Web3(provider);
        const networkId = await web3.eth.net.getId();

        this.web3 = web3;
        this.eth = web3.eth;
        this.networkId = networkId || 0;

        if (account) {
            this.account = account;
        } else {
            const [address] = await web3.eth.getAccounts();
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
            contractName,
            abi,
            bytecode,
        } = config;
        if (!this.abis[contractName]) {
            this.registerInterface(config);
        }

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
                                const contract = this.deployed(contractName, contractAddress);
                                resolve(contract);
                            } else if (error) {
                                clearInterval(interval);
                                reject(new Error(error));
                            }
                        });
                    }, 1000);
                });
        });
    }

    triggerMethod = async (type, {
        method,
        contractAddress,
        fromAddress,
        args,
        web3 = this.web3,
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
                gas: estimatedGas,
                ...methodSetting,
            });
        }

        if (type === 'sendSigned') {
            if (!contractAddress) {
                errorLog('contractAddress should be passed');
                return null;
            }

            const encodedData = method(...methodArgs).encodeABI();
            const tx = {
                to: contractAddress,
                data: encodedData,
                gas: estimatedGas,
                ...methodSetting,
            };

            const {
                privateKey,
            } = methodSetting || {};
            const signedT = await this.web3.eth.accounts.signTransaction(tx, privateKey);

            return new Promise(async (resolve, reject) => {
                this.web3.eth.sendSignedTransaction(signedT.rawTransaction).on('receipt', ({ transactionHash }) => {
                    const interval = setInterval(() => {
                        this.web3.eth.getTransactionReceipt(transactionHash, (
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
                });
            });
        }

        return new Promise(async (resolve, reject) => {
            const options = {
                from: fromAddress,
                ...methodSetting,
                gas: estimatedGas,
            };
            const methodSend = method(...methodArgs).send(options);
            methodSend.once('transactionHash', (receipt) => {
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
            });

            methodSend.on('error', (error) => {
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
                    sendSigned: async (...args) => this.triggerMethod('sendSigned', {
                        method,
                        contractAddress: contractAddress || contract.address,
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
                            send: async (...args) => this.triggerMethod('send', {
                                method: gsnContract.methods[methodName],
                                fromAddress: signingInfo.address,
                                args,
                                web3,
                            }),
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
