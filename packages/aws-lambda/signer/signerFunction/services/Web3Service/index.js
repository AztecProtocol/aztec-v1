const Web3 = require('web3');
const {
    errorLog,
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

        if (account) {
            this.account = account;
        }
    }

    signData(
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

        return this.web3.eth.accounts.sign(solSha3, privateKey);
    }
}

module.exports = new Web3Service();
