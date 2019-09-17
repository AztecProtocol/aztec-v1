/* eslint-disable func-names */
const JoinSplitProof65793 = require('./epoch0/BALANCED/joinSplit');
const proofExport = require('./proofExport');

function JoinSplitProof(...args) {
    return proofExport.exportProof(JoinSplitProof65793, ...args);
}

JoinSplitProof.epoch = function(epochNum) {
    return (...args) => {
        return JoinSplitProof.bind({ epochNum })(...args);
    };
};

module.exports = JoinSplitProof;
