const BurnProof = require('./joinSplitFluid/burn');
const DividendProof = require('./dividend');
const JoinSplitProof = require('./joinSplit');
const JoinSplitProofFluid = require('./joinSplitFluid');
const MintProof = require('./joinSplitFluid/mint');
const { Proof, ProofType } = require('./proof');
const ProofUtils = require('./utils');
const SwapProof = require('./swap');

module.exports = {
    BurnProof,
    DividendProof,
    JoinSplitProof,
    JoinSplitProofFluid,
    MintProof,
    Proof,
    ProofType,
    ProofUtils,
    SwapProof,
};
