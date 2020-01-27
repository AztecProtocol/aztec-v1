/* eslint-disable func-names */
import { errors } from '@aztec/dev-utils';

import * as catalogue from './catalogue';

const { AztecError } = errors;

const helpers = {};

/**
 * Validate that the epochNum is within the correct bounds - greater than one, less than the latest
 * epoch value
 *
 * @method validateEpochNum
 * @param epochNum
 */
helpers.validateEpochNum = function(proofType, epochNum) {
    const epochsForProof = catalogue.versions[proofType];
    const proofExists = epochsForProof ? !!epochsForProof[epochNum] : false;
    if (epochNum < 1 || !proofExists) {
        throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
            message: 'The requested epoch was either less than 0, or greater than the latest epoch number',
            epochNum,
            latestEpochNum: catalogue.LATEST_EPOCH,
        });
    }
};

export default helpers;
