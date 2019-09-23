const BurnProof66305 = require('../proofs/BURN/epoch0/burn');
const DividendProof66561 = require('../proofs/UTILITY/epoch0/dividend');
const JoinSplitProof65793 = require('../proofs/BALANCED/epoch0/joinSplit');
const MintProof66049 = require('../proofs/MINT/epoch0/mint');
const PrivateRangeProof66562 = require('../proofs/UTILITY/epoch0/privateRange');
const PublicRangeProof66563 = require('../proofs/UTILITY/epoch0/publicRange');
const SwapProof65794 = require('../proofs/BALANCED/epoch0/swap');

const catalogue = {};

/*
 * Default epoch numbers for each proof construction method
 */
catalogue.defaultProofEpochNums = {
    BURN: 1,
    DIVIDEND: 1,
    JOIN_SPLIT: 1,
    MINT: 1,
    PRIVATE_RANGE: 1,
    PUBLIC_RANGE: 1,
    SWAP: 1,
};

/*
 * Latest proof epoch
 */
catalogue.LATEST_EPOCH = 1;

/*
 * Struct containing a mapping of epoch numbers to the individual proofs
 */
catalogue.versions = {
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

module.exports = catalogue;
