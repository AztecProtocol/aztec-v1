pragma solidity >=0.5.0 <= 0.6.0;

/**
 * @title Library of MetaData manipulation operations
 * @author AZTEC
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/


// TODO: this library needs building out for all required operations
library MetaDataUtils {
    event MetaData(bytes data);
     /**
      * @dev Extract the approved addresses from the metaData
      * @param metaData - metaData containing addresses according to the schema defined in x
      */

    function extractAddresses(bytes memory metaData) internal returns (
        address addressToApprove
    ) {
    // TODO: this function will need to be built out to match the required schema
    // For testing purposes, it assumes the address to approve is the first EVM word of callData
    
        emit MetaData(metaData);
        assembly {
            addressToApprove := mload(add(metaData, 0x20))
        }
    }
}
