import Web3 from 'web3';
import {
    getPort,
} from '../../scripts/instances/ganacheInstance';
import AuthService from './AuthService';

const triggerMethod = async (type, method, ...args) => {
    const { address } = AuthService.getAccount();
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

    return new Promise((resolve, reject) => {
        method(...methodArgs)[type]({
            from: address,
            ...methodSetting,
            gas: 6500000,
        })
            .on('confirmation', async (confirmationNumber, receipt) => {
                if (!receipt) {
                    reject();
                    return;
                }
                resolve(receipt);
            });
    });
};

class Web3Service {
    constructor() {
        this.web3 = null;
        this.contracts = {};
        this.abis = {};
    }

    init() {
        if (this.web3) return;

        const port = getPort();
        const provider = new Web3.providers.HttpProvider(`http://localhost:${port}`);
        this.web3 = new Web3(provider);
    }

    async getAccounts() {
        if (!this.web3) {
            return [];
        }

        return this.web3.eth.getAccounts();
    }

    registerContract(
        config,
        {
            contractName = '',
            contractAddress = '',
        } = {},
    ) {
        if (!this.web3) return;

        const name = contractName || config.contractName;

        if (!config.abi) {
            console.log(`Contract object "${name}" doesn't have an abi.`);
            return;
        }

        let address = contractAddress;
        if (!address) {
            const lastNetworkId = Object.keys(config.networks).pop();
            const network = config.networks[lastNetworkId];
            address = network && network.address;
        }
        if (!address) {
            console.log(`Contract object "${name}" doesn't have an address. Please set an address first.`);
        }

        this.abis[name] = config.abi;
        this.contracts[name] = new this.web3.eth.Contract(
            config.abi,
            address,
        );
    }

    registerInterface(
        config,
        {
            name = '',
        } = {},
    ) {
        if (!this.web3) return;

        const interfaceName = name || config.contractName;
        this.abis[interfaceName] = config.abi;
    }

    hasContract(contractName) {
        return !!this.contracts[contractName];
    }

    contract(contractName) {
        if (!this.hasContract(contractName)) {
            console.log(`Contract object "${contractName}" hasn't been initiated.`);
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
        }
        if (!contract) {
            console.log(`'${contractName}' is not registered as a contract.`);
        }
        return contract;
    }

    async deploy(config, constructorArguments = []) {
        const contractObj = new this.web3.eth.Contract(config.abi);
        const { bytecode } = config;
        const { address } = AuthService.getAccount();
        contractObj.options.data = bytecode;

        return new Promise((resolve) => {
            contractObj
                .deploy({
                    arguments: constructorArguments,
                })
                .send({
                    from: address,
                    gas: 6500000,
                }, async (error, transactionHash) => {
                    const receipt = await this.web3.eth.getTransactionReceipt(transactionHash);
                    resolve(receipt);
                });
        });
    }

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
                    call: async (...args) => triggerMethod('call', method, ...args),
                    send: async (...args) => triggerMethod('send', method, ...args),
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
                    console.log(`'${contractName}' is not registered as an interface.`);
                }
                return this.useContract(contractName, address);
            },
        };
    }
}

export default new Web3Service();
