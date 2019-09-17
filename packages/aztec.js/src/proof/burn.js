/* eslint-disable func-names */
const BurnProof66305 = require('./epoch0/BURN/burn');
const proofExport = require('./proofExport');

function BurnProof(...args) {
    return proofExport.exportProof(BurnProof66305, ...args);
}

BurnProof.epoch = function(epochNum) {
    return (...args) => {
        return BurnProof.bind({ epochNum })(...args);
    };
};

module.exports = BurnProof;
