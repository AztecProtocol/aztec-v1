const JoinSplitFluidProof = require('../index');
const { ProofType } = require('../../proof');

class MintProof extends JoinSplitFluidProof {
    constructor(currentTotalValueNote, newTotalValueNote, mintedNotes, sender) {
        super(ProofType.MINT.name, currentTotalValueNote, newTotalValueNote, mintedNotes, sender);
    }
}

module.exports = MintProof;
