pragma solidity >=0.5.0 <0.6.0;

contract IAZTEC {
    enum ProofCategory {
        BALANCED,
        MINT,
        BURN,
        UTILITY
    }

    // 1 * 256**(2) + 0 * 256**(1) ++ 1 * 256**(0)
    uint24 public constant JOIN_SPLIT_PROOF = 65537;
}
