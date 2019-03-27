pragma solidity >= 0.5.0 <0.6.0;

library ProofUtils {

    /**
     * @dev We compress three uint8 numbers into only one uint24 to save gas.
     * Reverts if the category is not one of [1, 2, 3, 4].
     * @param proof The compressed uint24 number.
     @ @return A tuple (uint8, uint8, uint8) representing the epoch, category and proofId.
     */
    function getProofComponents(uint24 proof) internal pure returns (uint8, uint8, uint8) {
        uint8 epoch = uint8(proof >> 0x10);
        uint8 category = uint8(proof >> 0x08);
        uint8 id = uint8(proof);
        require(category >= 1 && category <= 4, "category has to be at least 1 and at maximum 4");
        return (epoch, category, id);
    }
}
