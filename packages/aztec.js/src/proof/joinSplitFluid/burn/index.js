const JoinSplitFluidProof = require('../index');
const { ProofType } = require('../../proof');

class BurnProof extends JoinSplitFluidProof {
    constructor(currentTotalValueNote, newTotalValueNote, burnedNotes, sender, metadata) {
        super(ProofType.BURN.name, currentTotalValueNote, newTotalValueNote, burnedNotes, sender, metadata);
    }
}

module.exports = BurnProof;
