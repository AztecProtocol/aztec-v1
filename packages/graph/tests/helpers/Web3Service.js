import Web3 from 'web3';
import {
    getPort,
} from '../../scripts/instances/ganacheInstance';
import {
    log,
} from '../../scripts/utils/log';
import AuthService from './AuthService';

class Web3Service {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.contracts = {};
        this.abis = {};
    }

    init() {
        if (this.web3) return;

        const port = getPort();
        const provider = new Web3.providers.HttpProvider(`http://localhost:${port}`);
        this.web3 = new Web3(provider);

        this.account = AuthService.getAccount();
    }

    registerContract(
        config,
        {
            contractName = '',
            contractAddress = '',
        } = {},
    ) {
        if (!this.web3) {
            return null;
        }

        const name = contractName || config.contractName;

        if (!config.abi) {
            log(`Contract object "${name}" doesn't have an abi.`);
            return null;
        }

        let customAddress = contractAddress;
        if (!customAddress) {
            const lastNetworkId = Object.keys(config.networks).pop();
            const network = config.networks[lastNetworkId];
            customAddress = network && network.address;
        }
        if (!customAddress) {
            log(`Contract object "${name}" doesn't have an address. Please set an address first.`);
            return null;
        }

        this.abis[name] = config.abi;

        const contract = new this.web3.eth.Contract(
            config.abi,
            customAddress,
        );

        const {
            _address: address,
        } = contract;
        contract.address = address;
        this.contracts[name] = contract;

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

    async deploy(config, constructorArguments = []) {
        const {
            contractName,
            abi,
        } = config;
        if (!this.abis[contractName]) {
            this.registerInterface(config);
        }
        const contractObj = new this.web3.eth.Contract(abi);
        const { bytecode } = config;
        const { address } = this.account;
        contractObj.options.data = bytecode;

        return new Promise((resolve, reject) => {
            contractObj
                .deploy({
                    arguments: constructorArguments,
                })
                .send({
                    from: address,
                    gas: 6500000,
                }, async (error, transactionHash) => {
                    const receipt = await this.web3.eth.getTransactionReceipt(transactionHash);
                    if (!receipt) {
                        reject(error);
                        return;
                    }

                    const {
                        contractAddress,
                    } = receipt;
                    const contract = this.deployed(contractName, contractAddress);
                    resolve(contract);
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

        const methodCall = method(...methodArgs)[type]({
            from: address,
            gas: 6500000,
            ...methodSetting,
        });

        if (type === 'call') {
            return methodCall;
        }

        return new Promise((resolve, reject) => {
            methodCall
                .then((receipt) => {
                    resolve(receipt);
                })
                .catch((error) => {
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
                    call: async (...args) => this.triggerMethod('call', method, ...args),
                    send: async (...args) => this.triggerMethod('send', method, ...args),
                };
            },
            events: (eventName) => {
                const contract = this.deployed(contractName, contractAddress);
                if (!contract) {
                    throw new Error(`Cannot call events('${eventName}') of undefined.`);
                }

                return {
                    all: () => contract.getPastEvents('allEvents', {
                        fromBlock: 0,
                    }),
                    where: (options = {}) => contract.getPastEvents(eventName, {
                        filter: options,
                    }),
                };
            },
            at: (address) => {
                if (!this.abis[contractName]) {
                    log(`'${contractName}' is not registered as an interface.`);
                }
                return this.useContract(contractName, address);
            },
        };
    }
}

export default new Web3Service();
