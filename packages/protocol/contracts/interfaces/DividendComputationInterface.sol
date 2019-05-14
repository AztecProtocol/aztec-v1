pragma solidity >=0.5.0 <0.6.0;

/**
 * @title DividendComputationInterface
 * @author AZTEC
 * @dev An interface defining the DividendComputationInterface standard.
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
interface DividendComputationInterface {
    function validateDividendComputation(
        bytes calldata,
        address,
        uint[6] calldata
    ) external pure returns (bytes memory);
}
