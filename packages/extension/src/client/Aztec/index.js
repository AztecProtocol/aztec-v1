import auth from '../auth';
import {
    assetFactory,
} from '../apis/asset';
import {
    noteFactory,
} from '../apis/note';

class Aztec {
    constructor() {
        this.enabled = false;
        this.auth = auth;
    }

    enable = () => {
        // TODO - check permission
        this.enabled = true;
        this.asset = assetFactory;
        this.note = noteFactory;
    };
}

export default Aztec;
