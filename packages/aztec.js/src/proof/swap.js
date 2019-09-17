/* eslint-disable func-names */
const proofExport = require('./proofExport');
const SwapProof65794 = require('./epoch0/BALANCED/swap');

function SwapProof(...args) {
    return proofExport.exportProof(SwapProof65794, ...args);
}

SwapProof.epoch = function(epochNum) {
    return (...args) => {
        return SwapProof.bind({ epochNum })(...args);
    };
};

module.exports = SwapProof;
