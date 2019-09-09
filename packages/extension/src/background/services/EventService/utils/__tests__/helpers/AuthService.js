import secp256k1 from '@aztec/secp256k1';

class AuthService {
    constructor() {
        this.accountIndex = 0;
        this.account = null;
        this.init();
    }

    init(accountIndex = 0) {
        this.accountIndex = accountIndex;
        //TODO: make it loadable from .env file
        const privateKey = '0xb8a23114e720d45005b608f8741639464a341c32c61920bf341b5cbddae7651d';
        const mnemonic = 'system box custom picture wonder across logic love program pyramid position plunge';
        const {
            publicKey,
            address,
        } = secp256k1.accountFromPrivateKey(privateKey);

        this.account = {
            address,
            publicKey,
            privateKey,
            mnemonic,
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
