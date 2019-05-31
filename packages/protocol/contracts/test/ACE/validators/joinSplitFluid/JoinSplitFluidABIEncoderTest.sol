pragma solidity >=0.5.0 <0.6.0;

import "../../../../ACE/validators/joinSplitFluid/JoinSplitFluidABIEncoder.sol";

contract JoinSplitFluidABIEncoderTest {

    function validateJoinSplitFluid(
        bytes calldata,
        address,
        uint[6] calldata
    )
        external
        pure
        returns (bytes memory)
    {
        JoinSplitFluidABIEncoder.encodeAndExit();
    }
}
