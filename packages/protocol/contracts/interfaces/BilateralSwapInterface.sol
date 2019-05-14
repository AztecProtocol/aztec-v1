pragma solidity >=0.5.0 <0.6.0;

/**
 * @title BilateralSwapInterface
 * @author AZTEC
 * @dev An interface defining the BilateralSwapInterface standard.
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
interface BilateralSwapInterface {    
    function validateBilateralSwap(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) external pure returns (bytes memory);
}
