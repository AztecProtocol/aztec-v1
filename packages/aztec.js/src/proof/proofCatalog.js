const BurnProof66305 = require('./epoch0/BURN/burn');
const DividendProof66561 = require('./epoch0/UTILITY/dividend');
const JoinSplitProof65793 = require('./epoch0/BALANCED/joinSplit');
const MintProof66049 = require('./epoch0/MINT/mint');
const PrivateRangeProof66562 = require('./epoch0/UTILITY/privateRange');
const PublicRangeProof66563 = require('./epoch0/UTILITY/publicRange');
const SwapProof65794 = require('./epoch0/BALANCED/swap');

const proofCatalog = {};

/*
 * Default epoch number for which proof construction methods are exported
 */
proofCatalog.defaultEpochNum = 1;

/*
 * Latest proof epoch
 */
proofCatalog.LATEST_EPOCH = 1;

/*
 * Struct containing a mapping of epoch numbers to the individual proofs
 */
proofCatalog.versions = {
    BURN: {
        1: BurnProof66305,
    },
    DIVIDEND: {
        1: DividendProof66561,
    },
    JOIN_SPLIT: {
        1: JoinSplitProof65793,
    },
    MINT: {
        1: MintProof66049,
    },
    PRIVATE_RANGE: {
        1: PrivateRangeProof66562,
    },
    PUBLIC_RANGE: {
        1: PublicRangeProof66563,
    },
    SWAP: {
        1: SwapProof65794,
    },
};

module.exports = proofCatalog;
