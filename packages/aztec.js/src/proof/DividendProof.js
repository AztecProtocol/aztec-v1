/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');
const DividendProof66561 = require('./epoch0/UTILITY/dividend');

const { AztecError } = errors;

function DividendProof(...args) {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new DividendProof66561(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
}

DividendProof.epoch = function(epochNum) {
    return (...args) => {
        return DividendProof.bind({ epochNum })(...args);
    };
};

module.exports = DividendProof;
