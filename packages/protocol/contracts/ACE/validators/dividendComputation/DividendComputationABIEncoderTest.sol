pragma solidity >=0.5.0 <0.6.0;

import "./DividendComputationABIEncoder.sol";

contract DividendComputationABIEncoderTest {
    function validateDividendComputation(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        pure 
        returns (bytes memory) 
    {
        DividendComputationABIEncoder.encodeAndExit();
    }
}
