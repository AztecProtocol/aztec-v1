import asset from './asset';

class Aztec {
    constructor() {
        this.enabled = false;
    }

    enable = () => {
        // TODO - check permission
        this.enabled = true;
        this.asset = asset;
    };
}

export default Aztec;
