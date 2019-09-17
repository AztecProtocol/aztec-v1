/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');
const BurnProof66305 = require('./epoch0/BURN/burn');

const { AztecError } = errors;

function ProofExport(...args) {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new BurnProof66305(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
}

ProofExport.epoch = function (epochNum) {
    return (...args) => {
        return (ProofExport.bind({ epochNum }))(...args)
    };
}

module.exports = ProofExport;