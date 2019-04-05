/**
 * Predefined proofs used for testing. Note that proofs are uint24 objects,
 * so we need to compress three uint8 (epoch, category, id) by shifting the
 * epoch and the category by 16 and 8 bits, respectively. For example:
 * 
 * 65537 = 1 * 256**(2) + 0 * 256**(1) + 1 * 256**(0)
 */
module.exports = {
    BOGUS_PROOF: '65538',
    BURN_PROOF: '66305',
    JOIN_SPLIT_PROOF: '65793',
    MINT_PROOF: '66049',
    UTILITY_PROOF: '66561',
};
