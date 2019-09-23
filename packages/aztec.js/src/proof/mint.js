/* eslint-disable func-names */
const helpers = require('./exportHandler/helpers');
const exportHandler = require('./exportHandler');
const ProofType = require('./base/types');

/**
 * Export the MintProof for a default epoch
 *
 * @method MintProof
 * @param  {...any} args - rest parameter representing proof inputs
 * @returns A MintProof construction for the default epoch
 */
function MintProof(...args) {
    return exportHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.MINT.name, ...args);
}

/**
 * Export the MintProof for a given epoch number
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
        exportHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return MintProof.bind({ epochNum })(...args);
    };
};

module.exports = MintProof;
