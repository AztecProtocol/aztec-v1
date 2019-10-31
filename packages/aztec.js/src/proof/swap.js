/* eslint-disable func-names */
const { getProof, setDefaultEpoch, helpers } = require('./exportHandler');
const { SWAP } = require('./base/types');

/**
 * Export the SwapProof for a default epoch
 *
 * @method SwapProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A SwapProof construction for the default epoch
 */
function SwapProof(...args) {
    const Proof = getProof(SWAP.name, this.epochNum);

    return new Proof(...args);
}

/**
 * Export the SwapProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a SwapProof is to be returned
 * @param {bool} setDefaultEpoch - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A SwapProof construction for the given epoch number
 */
SwapProof.epoch = function(epochNum, setAsDefault = false) {
    helpers.validateEpochNum(SWAP.name, epochNum);

    if (setAsDefault) {
        setDefaultEpoch(SWAP.name, epochNum);
    }

    return (...args) => {
        return SwapProof.call({ epochNum }, ...args);
    };
};

module.exports = SwapProof;
