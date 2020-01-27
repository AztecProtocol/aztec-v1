/* eslint-disable func-names */
import { getProof, setDefaultEpoch, helpers } from './exportHandler';

import proofTypes from './base/types';
/**
 * Export the PrivateRangeProof for a default epoch
 *
 * @method PrivateRangeProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A PrivateRangeProof construction for the default epoch
 */
function PrivateRangeProof(...args) {
    const Proof = getProof(proofTypes.PRIVATE_RANGE.name, this.epochNum);

    return new Proof(...args);
}

/**
 * Export the PrivateRangeProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a PrivateRangeProof is to be returned
 * @param {bool} setAsDefault - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A PrivateRangeProof construction for the given epoch number
 */
PrivateRangeProof.epoch = function(epochNum, setAsDefault = false) {
    helpers.validateEpochNum(proofTypes.PRIVATE_RANGE.name, epochNum);

    if (setAsDefault) {
        setDefaultEpoch(proofTypes.PRIVATE_RANGE.name, epochNum);
    }

    return (...args) => {
        return PrivateRangeProof.call({ epochNum }, ...args);
    };
};

export default PrivateRangeProof;
