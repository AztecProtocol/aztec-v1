/* eslint-disable func-names */
const { errors, proofs } = require('@aztec/dev-utils');

const { AztecError } = errors;

const proofExport = {};

proofExport.exportProof = (Proof, ...args) => {
    if (!this.epochNum) {
        this.epochNum = 1; // default epochNumber
    }

    switch (this.epochNum) {
        case 1:
            return new Proof(...args);
        default:
            throw new AztecError(errors.codes.EPOCH_DOES_NOT_EXIST, {
                message: 'The requested epoch number was greater than the latest epoch',
                epochNum: this.epochNum,
                latestEpochNum: proofs.LATEST_EPOCH,
            });
    }
};

module.exports = proofExport;
