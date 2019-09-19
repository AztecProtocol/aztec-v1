/* eslint-disable func-names */
const helpers = require('./helpers');
const proofHandler = require('./proofHandler');
const { ProofType } = require('./epoch0/proof');

/**
 * Export the DividendProof for a default epoch
 *
 * @method DividendProof
 * @param  {...any} args - rest parameter representing all
 * @returns An instance of the default DividendProof with the passed parameters
 */
function DividendProof(...args) {
    return proofHandler.exportProof.bind({ epochNum: this.epochNum })(ProofType.DIVIDEND.name, ...args);
}

/**
 * Export a DividendProof for a given epoch number
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
        proofHandler.setDefaultEpoch(epochNum);
    }

    return (...args) => {
        return DividendProof.bind({ epochNum })(...args);
    };
};

module.exports = DividendProof;
