/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');
const SwapProof65794 = require('./epoch0/BALANCED/swap');

const { AztecError } = errors;

function SwapProof(...args) {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new SwapProof65794(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
}

SwapProof.epoch = function(epochNum) {
    return (...args) => {
        return SwapProof.bind({ epochNum })(...args);
    };
};

module.exports = SwapProof;
