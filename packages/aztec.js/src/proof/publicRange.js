/* eslint-disable func-names */
const helpers = require('./helpers');
const proofHandler = require('./proofHandler');
const { ProofType } = require('./epoch0/proof');

/**
 * Export the PublicRangeProof for a default epoch
 *
 * @method PublicRangeProof
 * @param  {...any} args - rest parameter representing all
 * @returns An instance of the default PublicRangeProof with the passed parameters
 */
function PublicRangeProof(...args) {
    return proofHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.PUBLIC_RANGE.name, ...args);
}

/**
 * Export a PublicRangeProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a PublicRangeProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A PublicRangeProof construction for the given epoch number
 */
PublicRangeProof.epoch = function(epochNum, setDefaultEpoch = false) {
    helpers.validateEpochNum(epochNum);

    if (setDefaultEpoch) {
        proofHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return PublicRangeProof.bind({ epochNum })(...args);
    };
};

module.exports = PublicRangeProof;
