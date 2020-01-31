pragma solidity >= 0.5.0 <0.6.0;

/**
 * @title VersioningUtils
 * @author AZTEC
 * @dev Library of versioning utility functions
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
