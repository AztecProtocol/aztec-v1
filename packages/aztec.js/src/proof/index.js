const BurnProof = require('./burn');
const DividendProof = require('./dividend');
const JoinSplitProof = require('./joinSplit');
const MintProof = require('./mint');
const { Proof, ProofType } = require('./epoch0/proof');
const ProofUtils = require('./epoch0/utils');
const PrivateRangeProof = require('./privateRange');
const PublicRangeProof = require('./publicRange');
const SwapProof = require('./swap');

module.exports = {
    BurnProof,
    DividendProof,
    JoinSplitProof,
    MintProof,
    PrivateRangeProof,
    Proof,
    ProofType,
    ProofUtils,
    PublicRangeProof,
    SwapProof,
};
