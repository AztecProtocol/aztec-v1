/* eslint-disable func-names */
const catalogue = require('./catalogue');
const helpers = require('./helpers');

const exportHandler = {};
exportHandler.catalogue = catalogue;
exportHandler.helpers = helpers;

/**
 * Export the default epoch version of an AZTEC proof construction method
 *
 * @method exportProof
 * @param {string} proofSelector - proof type (e.g. JOIN_SPLIT, MINT etc.) to be exported
 * @param args - rest parameter representing the inputs to a particular proof construction
 * @returns An instance of the selected AZTEC proof
 */
exportHandler.exportProof = function(proofSelector, ...args) {
    if (!this.epochNum) {
        this.epochNum = exportHandler.catalogue.defaultProofEpochNums[proofSelector];
    }
    const Proof = exportHandler.catalogue.versions[proofSelector][this.epochNum];
    return new Proof(...args);
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
