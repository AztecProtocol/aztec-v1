/* eslint-disable func-names */
const DividendProof66561 = require('./epoch0/UTILITY/dividend');
const proofExport = require('./proofExport');

function DividendProof(...args) {
    return proofExport.exportProof(DividendProof66561, ...args);
}

DividendProof.epoch = function(epochNum) {
    return (...args) => {
        return DividendProof.bind({ epochNum })(...args);
    };
};

module.exports = DividendProof;
