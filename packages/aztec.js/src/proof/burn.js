/* eslint-disable func-names */
const exportHandler = require('./exportHandler');
const ProofType = require('./base/types');

/**
 * Export the BurnProof for a default epoch
 *
 * @method BurnProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A BurnProof construction for the default epoch
 */
function BurnProof(...args) {
    return exportHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.BURN.name, ...args);
}

/**
 * Export the BurnProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a BurnProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A BurnProof construction for the given epoch number
 */
BurnProof.epoch = function(epochNum, setDefaultEpoch = false) {
    exportHandler.helpers.validateEpochNum(epochNum);

    if (setDefaultEpoch) {
        exportHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return BurnProof.bind({ epochNum })(...args);
    };
};

module.exports = BurnProof;
