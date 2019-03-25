/**
 * Predefined proofs used for testing. Note that proofs are uint24 objects,
 * so we need to compress three uint8 (epoch, category, id) by shifting the
 * epoch and the category by 16 and 8 bits, respectively.
 */
module.exports = {
    /* 1 * 256**(2) + 0 * 256**(1) + 1 * 256**(0) */
    JOIN_SPLIT_PROOF: '65537',
    MINT_PROOF: '65793',
    BURN_PROOF: '66049',
};
