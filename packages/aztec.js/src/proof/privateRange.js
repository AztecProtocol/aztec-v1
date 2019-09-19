/* eslint-disable func-names */
const helpers = require('./helpers');
const proofHandler = require('./proofHandler');
const { ProofType } = require('./epoch0/proof');

/**
 * Export the PrivateRangeProof for a default epoch
 *
 * @method PrivateRangeProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A PrivateRangeProof construction for the default epoch
 */
function PrivateRangeProof(...args) {
    return proofHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.PRIVATE_RANGE.name, ...args);
}

/**
 * Export the PrivateRangeProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a PrivateRangeProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A PrivateRangeProof construction for the given epoch number
 */
PrivateRangeProof.epoch = function(epochNum, setDefaultEpoch = false) {
    helpers.validateEpochNum(epochNum);

    if (setDefaultEpoch) {
        proofHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return PrivateRangeProof.bind({ epochNum })(...args);
    };
};

module.exports = PrivateRangeProof;
