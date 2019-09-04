import registerExtension from './RegisterExtension';
import registerDomain from './RegisterDomain';
import createAndSendDeposit from './Deposit';
import asset from './Asset';

class API {
    constructor() {
        this.registerExtension = registerExtension;
        this.registerDomain = registerDomain;
        this.createAndSendDepositProof = createAndSendDeposit;
        this.asset = asset;
    }

    run({ query, ...rest }, connection) {
        return this[query](rest, connection);
    }
}

export default new API();
