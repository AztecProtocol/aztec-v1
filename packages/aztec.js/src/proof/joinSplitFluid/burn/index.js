const JoinSplitFluidProof = require('../index');
const { ProofType } = require('../../proof');

class BurnProof extends JoinSplitFluidProof {
    constructor(currentTotalValueNote, newTotalValueNote, mintedNotes, sender) {
        super(ProofType.BURN.name, currentTotalValueNote, newTotalValueNote, mintedNotes, sender);
    }
}

module.exports = BurnProof;
