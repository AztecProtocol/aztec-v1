import registerExtension from './RegisterExtension';
import registerDomain from './RegisterDomain';
import validateAccounts from './utils/validateAccounts';
import prove from './Prove';
import asset from './Asset';
import note from './Note';
import noteWithViewingKey from './Note/exportViewingKey';
import grantNoteAccess from './Note/grantNoteAccess';
import assetBalance from './Asset/getBalance';

class API {
    constructor() {
        this.registerExtension = registerExtension;
        this.registerDomain = registerDomain;
        this.asset = asset;
        this.note = note;
        this.noteWithViewingKey = noteWithViewingKey;
        this.grantNoteAccess = grantNoteAccess;
        this.assetBalance = assetBalance;
        this.constructProof = prove;
    }

    async clientApi(request, connection) {
        // TODO move all auth here
        const middelware = {
            grantNoteAccess: validateAccounts,
        };
        const { data: { query, args }, domain } = request;
        if (middelware[query]) {
            const {
                error,
            } = await middelware[query]({ ...args, domain });
            if (error) {
                return {
                    ...request,
                    ...error,
                };
            }
        }
        return this[query](request, connection);
    }
}

export default new API();
