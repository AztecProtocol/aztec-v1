/* eslint-disable func-names */
const MintProof66049 = require('./epoch0/MINT/mint');
const proofExport = require('./proofExport');

function MintProof(...args) {
    return proofExport.exportProof(MintProof66049, ...args);
}

MintProof.epoch = function(epochNum) {
    return (...args) => {
        return MintProof.bind({ epochNum })(...args);
    };
};

module.exports = MintProof;
