/**
 * Predefined proofs used for testing. Note that proofs are uint24 objects,
 * so we need to compress three uint8 (epoch, category, id) by shifting the
 * epoch and the category by 16 and 8 bits, respectively. For example:
 *
 * 65793 = 1 * 256**(2) + 1 * 256**(1) + 1 * 256**(0)
 */
module.exports = {
    BILATERAL_SWAP_PROOF: '65794',
    BOGUS_PROOF: '65538',
    BURN_PROOF: '66305',
    DIVIDEND_PROOF: '66561',
    JOIN_SPLIT_PROOF: '65793',
    MINT_PROOF: '66049',
    // TODO: remove this duplicate value
    UTILITY_PROOF: '66561',
    PRIVATE_RANGE_PROOF: '66562',
};
