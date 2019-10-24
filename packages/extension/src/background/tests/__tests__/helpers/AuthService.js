import secp256k1 from '@aztec/secp256k1';
// import '../../../../../env';

class AuthService {
    constructor() {
        this.accountIndex = 0;
        this.account = null;
        this.init();
    }

    init(accountIndex = 0) {
        this.accountIndex = accountIndex;
        const privateKey = process.env[`GANACHE_TESTING_ACCOUNT_${this.accountIndex}`];
        const mnemonic = process.env[`GANACHE_TESTING_ACCOUNT_${this.accountIndex}_MNEMONIC`];
        const rinkebySeedPhrase = process.env[`RINKEBY_TESTING_ACCOUNT_${this.accountIndex}_AZTEC_SEED_PHRASE`];
        const {
            publicKey,
            address,
        } = secp256k1.accountFromPrivateKey(privateKey);

        this.account = {
            address,
            publicKey,
            privateKey,
            mnemonic,
            rinkebySeedPhrase,
        };
    }

    getAccount(accountIndex = 0) {
        if (accountIndex !== this.accountIndex) {
            this.init(accountIndex);
        }
        return this.account;
    }
}

export default new AuthService();
