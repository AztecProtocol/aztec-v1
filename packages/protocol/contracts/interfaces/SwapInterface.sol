pragma solidity >=0.5.0 <0.6.0;

/**
 * @title SwapInterface
 * @author AZTEC
 * @dev An interface for the Swap validator contract
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
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
