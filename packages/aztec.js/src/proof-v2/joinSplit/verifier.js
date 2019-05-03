const { ProofType } = require('../index');
const { Verifier } = require('../verifier');

class JoinSplitVerifier extends Verifier {
    constructor() {
        super(ProofType.JOIN_SPLIT.name);
    }
}

module.exports = { JoinSplitVerifier };
