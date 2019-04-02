pragma solidity >=0.5.0 <0.6.0;

import "./AdjustSupplyABIEncoder.sol";

contract AdjustSupplyABIEncoderTest {

    function validateAdjustSupply(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        pure 
        returns (bytes memory) 
    {
        AdjustSupplyABIEncoder.encodeAndExit();
    }
}
