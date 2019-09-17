/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');
const PrivateRangeProof66562 = require('./epoch0/UTILITY/privateRange');

const { AztecError } = errors;

function PrivateRangeProof(...args) {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new PrivateRangeProof66562(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
}

PrivateRangeProof.epoch = function(epochNum) {
    return (...args) => {
        return PrivateRangeProof.bind({ epochNum })(...args);
    };
};

module.exports = PrivateRangeProof;
