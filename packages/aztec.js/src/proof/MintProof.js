/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');
const MintProof66049 = require('./epoch0/MINT/mint');

const { AztecError } = errors;

function MintProof(...args) {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new MintProof66049(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
}

MintProof.epoch = function(epochNum) {
    return (...args) => {
        return MintProof.bind({ epochNum })(...args);
    };
};

module.exports = MintProof;
