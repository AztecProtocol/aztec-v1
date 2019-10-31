/* eslint-disable func-names */
const { getProof, setDefaultEpoch, helpers } = require('./exportHandler');
const { DIVIDEND } = require('./base/types');

/**
 * Export the DividendProof for a default epoch
 *
 * @method DividendProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A DividendProof construction for the default epoch
 */
function DividendProof(...args) {
    const Proof = getProof(DIVIDEND.name, this.epochNum);

    return new Proof(...args);
}

/**
 * Export the DividendProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a DividendProof is to be returned
 * @param {bool} setAsDefault - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A DividendProof construction for the given epoch number
 */
DividendProof.epoch = function(epochNum, setAsDefault = false) {
    helpers.validateEpochNum(DIVIDEND.name, epochNum);

    if (setAsDefault) {
        setDefaultEpoch(DIVIDEND.name, epochNum);
    }

    return (...args) => {
        return DividendProof.call({ epochNum }, ...args);
    };
};

module.exports = DividendProof;
