const JoinSplitFluidProof = require('../index');
const { ProofType } = require('../../proof');

class BurnProof extends JoinSplitFluidProof {
    constructor(currentTotalValueNote, newTotalValueNote, burnedNotes, sender) {
        super(ProofType.BURN.name, currentTotalValueNote, newTotalValueNote, burnedNotes, sender);
    }
}

module.exports = BurnProof;
