/* eslint-disable func-names */
const helpers = require('./exportHandler/helpers');
const exportHandler = require('./exportHandler');
const ProofType = require('./base/types');

/**
 * Export the PublicRangeProof for a default epoch
 *
 * @method PublicRangeProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A PublicRangeProof construction for the default epoch
 */
function PublicRangeProof(...args) {
    return exportHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.PUBLIC_RANGE.name, ...args);
}

/**
 * Export the PublicRangeProof for a given epoch number
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
        exportHandler.setDefaultEpoch(ProofType.PUBLIC_RANGE.name, epochNum);
    }

    return (...args) => {
        return PublicRangeProof.bind({ epochNum })(...args);
    };
};

module.exports = PublicRangeProof;
