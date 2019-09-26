/* eslint-disable func-names */
const catalogue = require('./catalogue');
const helpers = require('./helpers');

const exportHandler = {};
exportHandler.catalogue = catalogue;
exportHandler.helpers = helpers;

/**
 * Export the default epoch version of an AZTEC proof construction method
 *
 * @method getProof
 * @param {string} proofSelector - proof type (e.g. JOIN_SPLIT, MINT etc.) to be exported
 * @param args - rest parameter representing the inputs to a particular proof construction
 * @returns An instance of the selected AZTEC proof
 */
exportHandler.getProof = function(proofSelector, epoch = undefined) {
    const proofEpoch = epoch || catalogue.defaultProofEpochNums[proofSelector];
    const Proof = exportHandler.catalogue.versions[proofSelector][proofEpoch];
    return Proof;
};

/**
 * Set the default proof epoch for which proofs should be exported from
 *
 * @method setDefaultEpoch
 * @param defaultEpochNum - user specified default epoch number
 */
exportHandler.setDefaultEpoch = (proofSelector, defaultEpochNum) => {
    exportHandler.catalogue.defaultProofEpochNums[proofSelector] = defaultEpochNum;
};

module.exports = exportHandler;
