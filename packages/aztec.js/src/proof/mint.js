/* eslint-disable func-names */
const helpers = require('./helpers');
const proofHandler = require('./proofHandler');
const { ProofType } = require('./epoch0/proof');

/**
 * Export the MintProof for a default epoch
 *
 * @method MintProof
 * @param  {...any} args - rest parameter representing all
 * @returns An instance of the default MintProof with the passed parameters
 */
function MintProof(...args) {
    return proofHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.MINT.name, ...args);
}

/**
 * Export a MintProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a MintProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A MintProof construction for the given epoch number
 */
MintProof.epoch = function(epochNum, setDefaultEpoch = false) {
    helpers.validateEpochNum(epochNum);

    if (setDefaultEpoch) {
        proofHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return MintProof.bind({ epochNum })(...args);
    };
};

module.exports = MintProof;
