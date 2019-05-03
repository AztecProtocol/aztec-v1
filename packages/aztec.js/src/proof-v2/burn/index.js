const { Proof, ProofType } = require('../index');

class BurnProof extends Proof {
    constructor(inputNotes, outputNotes, sender, publicOwner, kPublic) {
        super(ProofType.BURN.name, inputNotes, outputNotes, sender, publicOwner, kPublic);
    }
}

module.exports = { BurnProof };
