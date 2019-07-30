pragma solidity >=0.5.0 <0.6.0;

import "../../../../ACE/validators/privateRange/PrivateRangeABIEncoder.sol";

contract PrivateRangeABIEncoderTest {

    function validatePrivateRange(
        bytes calldata,
        address,
        uint[6] calldata
    )
        external
        pure
        returns (bytes memory)
    {
        PrivateRangeABIEncoder.encodeAndExit();
    }
}
