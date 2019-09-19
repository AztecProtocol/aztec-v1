/* eslint-disable func-names */
const helpers = require('./helpers');
const proofHandler = require('./proofHandler');
const { ProofType } = require('./epoch0/proof');

/**
 * Export the JoinSplitProof for a default epoch
 *
 * @method JoinSplitProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A JoinSplitProof construction for the default epoch
 */
function JoinSplitProof(...args) {
    return proofHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.JOIN_SPLIT.name, ...args);
}

/**
 * Export the JoinSplitProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a JoinSplitProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A JoinSplitProof construction for the given epoch number
 */
JoinSplitProof.epoch = function(epochNum, setDefaultEpoch = false) {
    helpers.validateEpochNum(epochNum);

    if (setDefaultEpoch) {
        proofHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return JoinSplitProof.bind({ epochNum })(...args);
    };
};

module.exports = JoinSplitProof;
