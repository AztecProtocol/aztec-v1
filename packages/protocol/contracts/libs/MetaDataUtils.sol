pragma solidity >=0.5.0 <= 0.6.0;

/**
 * @title MetaDataUtils
 * @author AZTEC
 * @dev Library of MetaData manipulation operations
 * 
 * Copyright 2020 Spilsbury Holdings Ltd 
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/

library MetaDataUtils {
    /**
    * @dev Extract a single approved address from the metaData
    * @param metaData - metaData containing addresses according to the schema defined in x
    * @param addressPos - indexer for the desired address, the one to be extracted
    * @return desiredAddress - extracted address specified by the inputs to this function
    */
    function extractAddress(bytes memory metaData, uint256 addressPos) pure internal returns (address desiredAddress) {
        /**
        * Memory map of metaData. This is the ABI encoding of metaData, supplied by the client
        * The first word of any dynamic bytes array within this map, is the number of discrete elements in that 
        * bytes array. e.g. first word at 0xe1 is the number of approvedAddresses
        * 0x00 - 0x20 : length of metaData
        * 0x20 - 0x81 : ephemeral key
        * 0x81 - 0xa1 : approved addresses offset
        * 0xa1 - 0xc1 : encrypted view keys offset
        * 0xc1 - 0xe1 : app data offset
        * 0xe1 - L_addresses : approvedAddresses
        * (0xe1 + L_addresses) - (0xe1 + L_addresses + L_encryptedViewKeys) : encrypted view keys
        * (0xe1 + L_addresses + L_encryptedViewKeys) - (0xe1 + L_addresses + L_encryptedViewKeys + L_appData) : appData
        */

        uint256 numAddresses;
        assembly {
            numAddresses := mload(add(metaData, 0x20))
            desiredAddress := mload(
                add(
                    add(
                        metaData,
                        add(0xe1, 0x20)  // go to the start of addresses, jump over first word
                    ),
                    mul(addressPos, 0x20) // jump to the desired address
                )
            )
        }

        require(
            addressPos < numAddresses, 
            'addressPos out of bounds - addressPos must be less than the number of addresses to be approved'
        );
    }
}
