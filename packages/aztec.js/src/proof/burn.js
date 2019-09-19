/* eslint-disable func-names */
const helpers = require('./helpers');
const proofHandler = require('./proofHandler');
const { ProofType } = require('./epoch0/proof');

/**
 * Export the BurnProof for a default epoch
 *
 * @method BurnProof
 * @param  {...any} args - rest parameter representing all
 * @returns An instance of the default BurnProof with the passed parameters
 */
function BurnProof(...args) {
    return proofHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.BURN.name, ...args);
}

/**
 * Export a BurnProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a BurnProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A BurnProof construction for the given epoch number
 */
BurnProof.epoch = function(epochNum, setDefaultEpoch = false) {
    helpers.validateEpochNum(epochNum);

    if (setDefaultEpoch) {
        proofHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return BurnProof.bind({ epochNum })(...args);
    };
};

module.exports = BurnProof;
