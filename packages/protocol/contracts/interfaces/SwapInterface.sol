pragma solidity >=0.5.0 <0.6.0;

contract SwapInterface {
    function validateSwap(
        bytes calldata,
        address,
        uint[6] calldata
    )
        external
        pure
        returns (bytes memory)
    {}
}
