const { Proof, ProofType } = require('../index');

class TradeProof extends Proof {
    constructor(inputNotes, outputNotes, sender, publicOwner, kPublic) {
        super(ProofType.TRADE.name, inputNotes, outputNotes, sender, publicOwner, kPublic);
    }
}

module.exports = { TradeProof };
