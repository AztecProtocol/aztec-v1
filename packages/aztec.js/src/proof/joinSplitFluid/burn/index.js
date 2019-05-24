const JoinSplitFluidProof = require('../index');
const { ProofType } = require('../../proof');

class BurnProof extends JoinSplitFluidProof {
    constructor(currentTotalValueNote, newTotalValueNote, mintedNotes, sender, metadata) {
        super(ProofType.BURN.name, currentTotalValueNote, newTotalValueNote, mintedNotes, sender, metadata);
    }
}

module.exports = BurnProof;
