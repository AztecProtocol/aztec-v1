/* eslint-disable func-names */
const { getProof, setDefaultEpoch, helpers } = require('./exportHandler');
const { MINT } = require('./base/types');

/**
 * Export the MintProof for a default epoch
 *
 * @method MintProof
 * @param  {...any} args - rest parameter representing proof inputs
 * @returns A MintProof construction for the default epoch
 */
function MintProof(...args) {
    const Proof = getProof(MINT.name, this.epochNum);

    return new Proof(...args);
}

/**
 * Export the MintProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a MintProof is to be returned
 * @param {bool} setAsDefault - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A MintProof construction for the given epoch number
 */
MintProof.epoch = function(epochNum, setAsDefault = false) {
    helpers.validateEpochNum(MINT.name, epochNum);

    if (setAsDefault) {
        setDefaultEpoch(MINT.name, epochNum);
    }

    return (...args) => {
        return MintProof.call({ epochNum }, ...args);
    };
};

module.exports = MintProof;
