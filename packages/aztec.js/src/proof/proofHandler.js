/* eslint-disable func-names */
const proofCatalog = require('./proofCatalog');

const proofHandler = {};
proofHandler.catalog = proofCatalog;

/**
 * Export the default epoch version of an AZTEC proof construction method
 *
 * @method exportProof
 * @param {string} proofSelector - proof type (e.g. JOIN_SPLIT, MINT etc.) to be exported
 * @param args - rest parameter representing the inputs to a particular proof construction
 * @returns An instance of the selected AZTEC proof
 */
proofHandler.exportProof = function(proofSelector, ...args) {
    if (!this.epochNum) {
        this.epochNum = proofHandler.catalog.defaultEpochNum;
    }
    const Proof = proofHandler.catalog.versions[proofSelector][this.epochNum];
    return new Proof(...args);
};

/**
 * Set the default proof epoch for which proofs should be exported from
 *
 * @method setDefaultEpoch
 * @param defaultEpochNum - user specified default epoch number
 */
proofHandler.setDefaultEpoch = (defaultEpochNum) => {
    proofHandler.catalog.defaultEpochNum = defaultEpochNum;
};

module.exports = proofHandler;
