const JoinSplitFluidProof = require('../index');
const { ProofType } = require('../../proof');

class MintProof extends JoinSplitFluidProof {
    constructor(currentTotalValueNote, newTotalValueNote, mintedNotes, sender, metadata) {
        super(ProofType.MINT.name, currentTotalValueNote, newTotalValueNote, mintedNotes, sender, metadata);
    }
}

module.exports = MintProof;
