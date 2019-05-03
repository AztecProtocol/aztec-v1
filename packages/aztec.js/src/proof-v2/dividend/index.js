const { Proof, ProofType } = require('../index');

class DividendProof extends Proof {
    constructor(inputNotes, outputNotes, sender, publicOwner, kPublic) {
        super(ProofType.DIVIDEND.name, inputNotes, outputNotes, sender, publicOwner, kPublic);
    }
}

module.exports = { DividendProof };
