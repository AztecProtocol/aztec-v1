pragma solidity >=0.5.0 <0.6.0;

/**
 * @title Library of integer utility functions
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
library IntegerUtils {    
    /**
    * @dev Convert a uint256 input to a bytes5 output. Throw an error if not possible
    * @param num uint256 number to be converted
    * @return output - a bytes5 representation of the input
    */
    function toBytes5(uint256 num) internal pure returns (bytes5 output) {
        bool valid;
        assembly {
            valid := iszero(and(num, not(0xffffffffff)))
            output := num
        }
        require(valid, "toBytes5 failed, value has more than 5 bytes of data!");
    }
}
