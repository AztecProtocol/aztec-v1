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


    clientApi(request, connection) {
        const { data: { query } } = request;
        return this[query](request, connection);
    }
}

export default new API();
