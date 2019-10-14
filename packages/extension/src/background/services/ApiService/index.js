import registerExtension from './RegisterExtension';
import registerDomain from './RegisterDomain';
import prove from './Prove';
import asset from './Asset';
import note from './Note';
import noteWithViewingKey from './Note/exportViewingKey';
import assetBalance from './Asset/getBalance';

class API {
    constructor() {
        this.registerExtension = registerExtension;
        this.registerDomain = registerDomain;
        this.asset = asset;
        this.note = note;
        this.noteWithViewingKey = noteWithViewingKey;
        this.assetBalance = assetBalance;
        this.constructProof = prove;
    }


    clientApi(request, connection) {
        const { data: { query } } = request;
        return this[query](request, connection);
    }
}

export default new API();
