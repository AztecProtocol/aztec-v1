pragma solidity >= 0.5.0 <0.6.0;

/**
 * @title Library of versioning utility functions
 * @author AZTEC
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
library VersioningUtils {

    /**
     * @dev We compress three uint8 numbers into only one uint24 to save gas.
     * @param version The compressed uint24 number.
     * @return A tuple (uint8, uint8, uint8) representing the the deconstructed version.
     */
    function getVersionComponents(uint24 version) internal pure returns (uint8 first, uint8 second, uint8 third) {
        assembly {
            third := and(version, 0xff)
            second := and(div(version, 0x100), 0xff)
            first := and(div(version, 0x10000), 0xff)
        }
        return (first, second, third);
    }
}
