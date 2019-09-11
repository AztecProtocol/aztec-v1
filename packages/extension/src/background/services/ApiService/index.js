import registerExtension from './RegisterExtension';
import registerDomain from './RegisterDomain';
import prove from './Prove';
import asset from './Asset';

class API {
    constructor() {
        this.registerExtension = registerExtension;
        this.registerDomain = registerDomain;
        this.asset = asset;
        this.constructProof = prove;
    }


    clientApi({ query, ...rest }, connection) {
        return this[query](rest, connection);
    }
}

export default new API();
