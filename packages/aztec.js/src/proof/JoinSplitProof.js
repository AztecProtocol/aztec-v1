/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');
const JoinSplitProof65793 = require('./epoch0/BALANCED/joinSplit');
const ProofExport = require('./proofExport');

const { AztecError } = errors;

function JoinSplitProof(...args) {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new JoinSplitProof65793(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
}

JoinSplitProof.epoch = function(epochNum) {
    return (...args) => {
        return JoinSplitProof.bind({ epochNum })(...args);
    };
};

module.exports = JoinSplitProof;
