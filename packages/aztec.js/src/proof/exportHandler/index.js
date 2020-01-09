/* eslint-disable func-names */
import * as catalogue from './catalogue';

import helpers from './helpers';

export {
    catalogue,
    helpers,
};

/**
 * Export the default epoch version of an AZTEC proof construction method
 *
 * @method getProof
 * @param {string} proofSelector - proof type (e.g. JOIN_SPLIT, MINT etc.) to be exported
 * @param args - rest parameter representing the inputs to a particular proof construction
 * @returns An instance of the selected AZTEC proof
 */
export function getProof(proofSelector, epoch = undefined) {
    const proofEpoch = epoch || catalogue.defaultProofEpochNums[proofSelector];
    const Proof = catalogue.versions[proofSelector][proofEpoch];
    return Proof;
};

/**
 * Set the default proof epoch for which proofs should be exported from
 *
 * @method setDefaultEpoch
 * @param defaultEpochNum - user specified default epoch number
 */
export function setDefaultEpoch(proofSelector, defaultEpochNum) {
    catalogue.defaultProofEpochNums[proofSelector] = defaultEpochNum;
};
