const Web3 = require('web3');
const {
    errorLog,
    warnLog,
} = require('../../utils/log');
const fixSignature = require('./helpers/fixSignature');

const {
    toBN,
    soliditySha3,
} = Web3.utils;

class Web3Service {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.abis = null;
    }

    async init({
        providerURL,
        account,
    } = {}) {
        if (!providerURL) {
            errorLog('providerURL cannot be empty.');
            return;
        }
        const provider = new Web3.providers.HttpProvider(providerURL);
        this.web3 = new Web3(provider);
        this.abis = {};

        if (account) {
            this.account = account;
        }
    }

    async signData(
        data,
        account = this.account,
    ) {
        const {
            relayerAddress,
            from,
            encodedFunctionCall,
            txFee,
            gasPrice,
            gas,
            nonce,
            relayHubAddress,
            to,
        } = data;

        const {
            privateKey,
        } = account;

        const solSha3 = soliditySha3(
            relayerAddress,
            from,
            encodedFunctionCall,
            toBN(txFee),
            toBN(gasPrice),
            toBN(gas),
            toBN(nonce),
            relayHubAddress,
            to,
        )
        const {
            message,
            messageHash,
            signature,
        } = await this.web3.eth.accounts.sign(solSha3, privateKey);
        return {
            message,
            messageHash,
            signature: fixSignature(signature),
        };
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

    deployed(contractName, contractAddress) {
        const contract = new this.web3.eth.Contract(
            this.abis[contractName],
            contractAddress,
        );
        const {
            _address: address,
        } = contract;
        contract.address = address;
        return contract;
    }

    useContract(contractName, contractAddress = null) {
        return {
            events: (eventName) => {
                const contract = this.deployed(contractName, contractAddress);
                if (!contract) {
                    throw new Error(`Cannot call events('${eventName}') of undefined.`);
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

module.exports = new Web3Service();
