const { errors } = require('@aztec/dev-utils');
const JoinSplitVerifier = require('../joinSplit/verifier');

class JoinSplitFluidVerifier extends JoinSplitVerifier {
    verifyProof() {
        const dataLength = this.proof.data.length;
        if (dataLength < 2) {
            this.errors.push(errors.codes.INCORRECT_NOTE_NUMBER);
        }
        super.verifyProof();
    }
}

module.exports = JoinSplitFluidVerifier;
