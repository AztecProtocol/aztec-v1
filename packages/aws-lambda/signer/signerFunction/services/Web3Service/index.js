const Web3 = require('web3');
const {
    errorLog,
} = require('../../utils/log');

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
            privateKey,
        } = account;
        return this.web3.eth.accounts.sign(data, privateKey);
    }
}

module.exports = new Web3Service();
