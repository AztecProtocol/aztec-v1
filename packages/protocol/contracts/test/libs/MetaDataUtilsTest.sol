pragma solidity >= 0.5.0 <0.6.0;

import "../../libs/MetaDataUtils.sol";

/**
 * @title MetaDataUtilsTest
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

contract MetaDataUtilsTest {
    using MetaDataUtils for bytes;

    /**
    * @dev Extract a single approved address from the metaData
    * @param metaData - metaData containing addresses according to the schema defined in x
    * @param addressPos - indexer for the desired address, the one to be extracted
    * @return desiredAddress - extracted address specified by the inputs to this function
    */
    function extractAddress(bytes memory metaData, uint256 addressPos) public pure returns (address desiredAddress) {
        return metaData.extractAddress(addressPos);
    }
}
