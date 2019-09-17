const BurnProof = require('./BurnProof');
const DividendProof = require('./DividendProof');
const JoinSplitProof = require('./JoinSplitProof');
const MintProof = require('./MintProof');
const { Proof, ProofType } = require('./proof');
const ProofUtils = require('./utils');
const PrivateRangeProof = require('./PrivateRangeProof');
const PublicRangeProof = require('./PublicRangeProof');
const SwapProof = require('./SwapProof');

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
