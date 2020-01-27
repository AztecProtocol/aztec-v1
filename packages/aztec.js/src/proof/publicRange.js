/* eslint-disable func-names */
import { getProof, setDefaultEpoch, helpers } from './exportHandler';

import proofTypes from './base/types';

/**
 * Export the PublicRangeProof for a default epoch
 *
 * @method PublicRangeProof
 * @param  {...any} args - rest parameter representing the proof inputs
 * @returns A PublicRangeProof construction for the default epoch
 */
function PublicRangeProof(...args) {
    const Proof = getProof(proofTypes.PUBLIC_RANGE.name, this.epochNum);

    return new Proof(...args);
}

/**
 * Export the PublicRangeProof for a given epoch number
 *
 * @method epoch
 * @param {Number} epochNum - epoch number for which a PublicRangeProof is to be returned
 * @param {bool} setAsDefault - if true, sets the inputted epochNum to be the default. If false, does
 * not set the inputted epoch number to be the default
 * @returns A PublicRangeProof construction for the given epoch number
 */
PublicRangeProof.epoch = function(epochNum, setAsDefault = false) {
    helpers.validateEpochNum(proofTypes.PUBLIC_RANGE.name, epochNum);

    if (setAsDefault) {
        setDefaultEpoch(proofTypes.PUBLIC_RANGE.name, epochNum);
    }

    return (...args) => {
        return PublicRangeProof.call({ epochNum }, ...args);
    };
};

export default PublicRangeProof;
