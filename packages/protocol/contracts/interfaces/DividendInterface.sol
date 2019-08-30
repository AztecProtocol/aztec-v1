pragma solidity >=0.5.0 <0.6.0;

/**
 * @title DividendInterface
 * @author AZTEC
 * @dev An interface for the dividend validator contract
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
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
