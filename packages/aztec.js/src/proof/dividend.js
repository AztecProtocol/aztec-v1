/* eslint-disable func-names */
const helpers = require('./exportHandler/helpers');
const exportHandler = require('./exportHandler');
const ProofType = require('./base/types');

/**
 * Export the DividendProof for a default epoch
 *
 * @method DividendProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A DividendProof construction for the default epoch
 */
function DividendProof(...args) {
    return exportHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.DIVIDEND.name, ...args);
}

/**
 * Export the DividendProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a DividendProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A DividendProof construction for the given epoch number
 */
DividendProof.epoch = function(epochNum, setDefaultEpoch = false) {
    helpers.validateEpochNum(epochNum);

    if (setDefaultEpoch) {
        exportHandler.setDefaultEpoch(ProofType.DIVIDEND.name, epochNum);
    }

    return (...args) => {
        return DividendProof.bind({ epochNum })(...args);
    };
};

module.exports = DividendProof;
