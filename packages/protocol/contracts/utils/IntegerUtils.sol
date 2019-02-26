pragma solidity >=0.5.0 <0.6.0;

library IntegerUtils {
    
    function uintToBytes(uint256 num, uint256 size) internal pure returns (bytes5 output) {
        bytes memory b = new bytes(5);
        for (uint i = 0; i < size; i++) {
            b[i] = byte(uint8(num / (2**(8*(size - 1 - i)))));
        }
        assembly { output := mload(add(b, 32)) }
        return output;
    }
}
