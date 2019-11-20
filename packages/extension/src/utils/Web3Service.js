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
        provider = null,
        providerUrl = '',
        account,
        gsnConfig,
    } = {}) {
        this.reset();
        this.gsnConfig = gsnConfig;

        let web3Provider = provider;
        if (!web3Provider && providerUrl) {
            if (providerUrl.match(/^wss?:\/\//)) {
                web3Provider = new Web3.providers.WebsocketProvider(providerUrl);
            } else {
                web3Provider = new Web3.providers.HttpProvider(providerUrl);
            }
        }
        if (!web3Provider) {
            web3Provider = window.ethereum;
        }

        let web3;
        let networkId;
        if (web3Provider) {
            web3 = new Web3(web3Provider);
            networkId = await web3.eth.net.getId();
        } else if (window.web3) {
            ({ web3 } = window);
            networkId = await new Promise((resolve) => {
                window.web3.version.getNetwork((_, id) => {
                    networkId = id;
                    resolve();
                });
            });
        } else {
            errorLog('Provider cannot be empty.');
            return;
        }

        if (web3Provider
            && typeof web3Provider.enable === 'function'
        ) {
            await web3Provider.enable();
        }

        this.web3 = web3;
        this.eth = web3.eth;
        this.networkId = networkId || 0;
        if (account) {
            this.account = account;
        } else {
            const [address] = await this.web3.eth.getAccounts();
            if (address) {
                this.account = {
                    address,
                };
            }
        }
    }

    async networkId() {
        return this.web3.eth.net.getId();
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

    deployed(contractName, contractAddress = '', useGSN = false) {
        let contract;
        if (!contractAddress && !useGSN) {
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
        if (useGSN && !this.gsnConfig) {
            log('Cannot use gsn as "this.gsnConfig" was not set');
        }
        if (useGSN && contract) {
            contract.setProvider(this.gsnConfig.gsnProvider);
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

    triggerMethod = async (type, method, contractAddress, ...args) => {
        const {
            address,
            privateKey,
        } = this.account || {};
        const methodSetting = (args.length
            && typeof args[args.length - 1] === 'object'
            && !Array.isArray(args[args.length - 1])
            && args[args.length - 1])
            || null;
        const methodArgs = methodSetting
            ? args.slice(0, args.length - 1)
            : args;

        if (type === 'call') {
            return method(...methodArgs).call({
                from: address,
                gas: 6500000,
                ...methodSetting,
            });
        }

        if (type === 'sendSigned') {
            if (!contractAddress) {
                errorLog('contractAddress should be passed');
                return null;
            }

            const encodedData = method(...methodArgs).encodeABI();
            const estimatedGas = await method(...methodArgs).estimateGas({
                from: address,
                gas: 6500000,
                ...methodSetting,
            });
            console.log({ estimatedGas });
            const tx = {
                to: contractAddress,
                data: encodedData,
                gas: estimatedGas,
                ...methodSetting,
            };

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

        let fromAddress = address;
        if (type === 'sendWithGSN') {
            fromAddress = this.gsnConfig.signingInfo.address;
        }

        return new Promise(async (resolve, reject) => {
            const options = {
                from: fromAddress,
                ...methodSetting,
                // gas: 6500000,
            };
            const methodSend = method(...methodArgs).send(options);
            methodSend.once('transactionHash', (receipt) => {
                log(`receipt: ${JSON.stringify(receipt)}`);

                const interval = setInterval(() => {
                    this.web3.eth.getTransactionReceipt(receipt, (
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
            method: (methodName, useGSN = false) => {
                const contract = this.deployed(contractName, contractAddress, useGSN);
                if (!contract) {
                    throw new Error(`Cannot call method '${methodName}' of undefined.`);
                }

                const method = contract.methods[methodName];
                if (!method) {
                    throw new Error(`Method '${methodName}' is not defined in contract '${contractName}'.`);
                }

                const address = contractAddress || contract.address;
                return {
                    call: async (...args) => this.triggerMethod('call', method, null, ...args),
                    send: async (...args) => this.triggerMethod(useGSN ? 'sendWithGSN' : 'send', method, null, ...args),
                    sendSigned: async (...args) => this.triggerMethod('sendSigned', method, address, ...args),
                };
            },
            events: (eventName) => {
                const contract = this.deployed(contractName, contractAddress);
                if (!contract) {
                    throw new Error(`Cannot call waitForEvent('${eventName}') of undefined.`);
                }
                return {
                    where: async (options = { filter: {}, fromBlock: 1, toBlock: 'latest' }) => contract.getPastEvents(eventName, {
                        filter: options.filter,
                        fromBlock: options.fromBlock,
                        toBlock: options.toBlock,
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
