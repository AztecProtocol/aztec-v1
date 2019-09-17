/* eslint-disable func-names */
const PrivateRangeProof66562 = require('./epoch0/UTILITY/privateRange');
const proofExport = require('./proofExport');

function PrivateRangeProof(...args) {
    return proofExport.exportProof(PrivateRangeProof66562, ...args);
}

PrivateRangeProof.epoch = function(epochNum) {
    return (...args) => {
        return PrivateRangeProof.bind({ epochNum })(...args);
    };
};

module.exports = PrivateRangeProof;
