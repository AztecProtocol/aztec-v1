/* eslint-disable func-names */
const { errors } = require('@aztec/dev-utils');
const proofCatalog = require('./proofCatalog');

const { AztecError } = errors;

const helpers = {};

/**
 * Validate that the epochNum is within the correct bounds - greater than one, less than the latest
 * epoch value
 *
 * @method validateEpochNum
 * @param epochNum
 */
helpers.validateEpochNum = function(epochNum) {
    if (epochNum < 1 || epochNum > proofCatalog.LATEST_EPOCH) {
        throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
            message: 'The requested epoch was either less than 0, or greater than the latest epoch number',
            epochNum,
            latestEpochNum: proofCatalog.LATEST_EPOCH,
        });
    }
};

module.exports = helpers;
