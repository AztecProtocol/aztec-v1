import Web3 from 'web3';
import {
    log,
    warnLog,
    errorLog,
} from '~utils/log';

class Web3Service {
    constructor() {
        this.web3 = null;
        this.contracts = {};
        this.abis = {};
        this.account = null;
    }

    async init({
        provider = window.web3.currentProvider,
        account,
    } = {}) {
        if (!provider) {
            errorLog('Provider cannot be empty.');
            return;
        }

        if (typeof provider.enable === 'function') {
            await provider.enable();
        }

        this.web3 = new Web3(provider);

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
            log(`Contract object "${contractName}" doesn't have an address. Please set an address first.`);
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

    deployed(contractName, contractAddress = '') {
        let contract;
        if (!contractAddress) {
            contract = this.contracts[contractName];
        } else if (this.abis[contractName]) {
            contract = new this.web3.eth.Contract(
                this.abis[contractName],
                contractAddress,
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
                    gas: gas * 2,
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

    triggerMethod = async (type, method, ...args) => {
        const { address } = this.account;
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

        return new Promise(async (resolve, reject) => {
            const methodCall = method(...methodArgs)[type]({
                from: address,
                ...methodSetting,
                gas: 6500000,
            });

            methodCall.once('transactionHash', (receipt) => {
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
                    call: async (...args) => this.triggerMethod('call', method, ...args),
                    send: async (...args) => this.triggerMethod('send', method, ...args),
                };
            },
            events: (eventName) => {
                const contract = this.deployed(contractName, contractAddress);
                if (!contract) {
                    throw new Error(`Cannot call waitForEvent('${eventName}') of undefined.`);
                }
                return {
                    where: (options = {}) => contract.getPastEvents(eventName, {
                        filter: options,
                    }),
                    all: () => contract.getPastEvents('allEvents', {
                        fromBlock: 0,
                    }),
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

export default new Web3Service();
