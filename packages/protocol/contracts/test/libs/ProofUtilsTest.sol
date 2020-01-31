pragma solidity >= 0.5.0 <0.6.0;

import "../../libs/ProofUtils.sol";

/**
 * @title ProofUtilsTest
 * @author AZTEC
 * @dev Library of proof utility functions
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
contract ProofUtilsTest {
    using ProofUtils for uint24;

    /**
     * @dev We compress three uint8 numbers into only one uint24 to save gas.
     * Reverts if the category is not one of [1, 2, 3, 4].
     * @param proof The compressed uint24 number.
     * @return A tuple (uint8, uint8, uint8) representing the epoch, category and proofId.
     */
    function getProofComponents(uint24 proof) public pure returns (uint8 epoch, uint8 category, uint8 id) {
        return proof.getProofComponents();
    }
}
