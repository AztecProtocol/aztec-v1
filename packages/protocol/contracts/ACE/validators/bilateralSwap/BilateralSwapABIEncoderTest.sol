pragma solidity >=0.5.0 <0.6.0;

import "./BilateralSwapABIEncoder.sol";

contract BilateralSwapABIEncoderTest {
    function validateBilateralSwap(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        pure 
        returns (bytes memory) 
    {
        BilateralSwapABIEncoder.encodeAndExit();
    }
}
