/* eslint-disable func-names */
const proofExport = require('./proofExport');
const PublicRangeProof66563 = require('./epoch0/UTILITY/publicRange');

function PublicRangeProof(...args) {
    return proofExport.exportProof(PublicRangeProof66563, ...args);
}

PublicRangeProof.epoch = function(epochNum) {
    return (...args) => {
        return PublicRangeProof.bind({ epochNum })(...args);
    };
};

module.exports = PublicRangeProof;
