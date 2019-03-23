pragma solidity >=0.5.0 <0.6.0;

library IntegerUtils {    
    function toBytes5(uint256 num) internal pure returns (bytes5 output) {
        bool valid;
        assembly {
            valid := iszero(and(num, not(0xffffffffff)))
            output := num
        }
        require(valid, "toBytes5 failed, value has more than 5 bytes of data!");
    }
}
