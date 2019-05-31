pragma solidity >=0.5.0 <0.6.0;

library DividendInterface {
    function validateDividend(
        bytes calldata,
        address,
        uint[6] calldata
    )
        external
        pure
        returns (bytes memory)
    {}
}
