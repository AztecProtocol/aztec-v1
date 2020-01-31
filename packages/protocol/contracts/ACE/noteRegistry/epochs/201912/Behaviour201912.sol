pragma solidity >=0.5.0 <0.6.0;

import "../201911/Behaviour201911.sol";

/**
 * @title Behaviour201912
 * @author AZTEC
 * @dev Details the methods and the storage schema of a note registry.
        Is an ownable contract, and should always inherrit from the previous
        epoch of the behaviour contract. This contract defines the shared methods
        between all asset types for the 201912 generation (epoch 3).
 * Methods are documented in interface.
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
contract Behaviour201912 is Behaviour201911 {
    // redefining to always pass
    modifier onlyIfAvailable() {
        _;
    }

    function makeAvailable() public onlyOwner {}

    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public onlyOwner returns (
        address publicOwner,
        uint256 transferValue,
        int256 publicValue
    ) {
        (
            publicOwner,
            transferValue,
            publicValue
        ) = super.updateNoteRegistry(_proof, _proofOutput);
    }
}
