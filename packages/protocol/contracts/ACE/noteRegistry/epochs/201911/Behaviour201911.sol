pragma solidity >=0.5.0 <0.6.0;

import "../201907/Behaviour201907.sol";

/**
 * @title Behaviour201911
 * @author AZTEC
 * @dev Details the methods and the storage schema of a note registry.
        Is an ownable contract, and should always inherrit from the previous
        epoch of the behaviour contract. This contract defines the shared methods
        between all asset types for the 201911 generation (epoch 2).

        This epoch adds the ability to slow release assets for a fixed amount of time.
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
contract Behaviour201911 is Behaviour201907 {
    uint256 public constant slowReleaseEnd = 1585699199;
    bool public isAvailableDuringSlowRelease = false;

    modifier onlyIfAvailable() {
        // Not sensitive to small differences in time
        require(isAvailableDuringSlowRelease == true || slowReleaseEnd < block.timestamp,
        "AZTEC is in burn-in period, and this asset is not available");
        _;
    }

    function makeAvailable() public onlyOwner {
        require(isAvailableDuringSlowRelease == false, "asset is already available");
        isAvailableDuringSlowRelease = true;
    }

    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public onlyOwner onlyIfAvailable returns (
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
