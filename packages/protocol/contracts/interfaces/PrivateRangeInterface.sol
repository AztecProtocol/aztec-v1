pragma solidity >=0.5.0 <0.6.0;


/**
 * @title PrivateRangeInterface
 * @author AZTEC
 * @dev An interface for the PrivateRange validator contract
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract PrivateRangeInterface {
    function validatePrivateRange(
        bytes calldata,
        address,
        uint[6] calldata
    )
        external
        pure
        returns (bytes memory)
    {}
}