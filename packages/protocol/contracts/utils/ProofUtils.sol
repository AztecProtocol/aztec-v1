pragma solidity >= 0.5.0 <0.6.0;

library ProofUtils {
    
    function getProofComponents(uint24 proof) internal pure returns (
        uint8 proofId,
        uint8 epoch,
        uint8 category
    ) {
        epoch = uint8(proof >> 0x10);
        category = uint8(proof >> 0x08);
        proofId = uint8(proof & 0xff);
    }
}
