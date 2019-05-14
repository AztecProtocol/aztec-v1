pragma solidity >=0.5.0 <0.6.0;


/**
 * @title PrivateRangeInterface
 * @author AZTEC
 * @dev An interface defining the PrivateRangeInterface standard.
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
interface PrivateRangeInterface {
    /* solhint-disable-next-line var-name-mixedcase */
    
    function validatePrivateRange(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) external pure returns (bytes memory);
}
