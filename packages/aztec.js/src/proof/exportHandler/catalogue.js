import BurnProof66305 from '../proofs/BURN/epoch0/burn';
import DividendProof66561 from '../proofs/UTILITY/epoch0/dividend';
import JoinSplitProof65793 from '../proofs/BALANCED/epoch0/joinSplit';
import MintProof66049 from '../proofs/MINT/epoch0/mint';
import PrivateRangeProof66562 from '../proofs/UTILITY/epoch0/privateRange';
import PublicRangeProof66563 from '../proofs/UTILITY/epoch0/publicRange';
import SwapProof65794 from '../proofs/BALANCED/epoch0/swap';

/*
 * Default epoch numbers for each proof construction method
 */
export const defaultProofEpochNums = {
    BURN: 1,
    DIVIDEND: 1,
    JOIN_SPLIT: 1,
    MINT: 1,
    PRIVATE_RANGE: 1,
    PUBLIC_RANGE: 1,
    SWAP: 1,
};

/*
 * Struct containing a mapping of epoch numbers to the individual proofs
 */
export const versions = {
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