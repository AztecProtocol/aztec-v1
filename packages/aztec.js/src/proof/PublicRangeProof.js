/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');
const PublicRangeProof66563 = require('./epoch0/UTILITY/publicRange');

const { AztecError } = errors;

function PublicRangeProof(...args) {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new PublicRangeProof66563(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
}

PublicRangeProof.epoch = function(epochNum) {
    return (...args) => {
        return PublicRangeProof.bind({ epochNum })(...args);
    };
};

module.exports = PublicRangeProof;
