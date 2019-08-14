pragma solidity >=0.5.0 <0.6.0;

import "../../../../ACE/validators/publicRange/PublicRangeABIEncoder.sol";
import "../../../../libs/LibEIP712.sol";

contract PublicRangeABIEncoderTest {
    function validatePublicRange(
        bytes calldata,
        address,
        uint[6] calldata
    )
        external pure
        returns (bytes memory)
    {
        PublicRangeABIEncoder.encodeAndExit();
    }
}
