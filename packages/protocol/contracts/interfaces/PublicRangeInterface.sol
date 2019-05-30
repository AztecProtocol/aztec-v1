pragma solidity >=0.5.0 <0.6.0;
import "../libs/LibEIP712.sol";

/**
 * @title PublicRangeInterface
 * @author AZTEC
 * @dev An interface defining the PublicRangeInterface standard.
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract PublicRangeInterface {    
    function validatePublicRange(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        pure 
        returns (bytes memory) 
    {}
}
