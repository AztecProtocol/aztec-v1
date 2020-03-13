pragma solidity >=0.5.0 <0.6.0;

import "../../ERC1724/ZkAsset.sol";

/**
 * @title ZkAssetBaseTest
 * @author AZTEC 
 * @dev Used for testing purposes
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
contract ZkAssetTest is ZkAsset {
    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAsset(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor
    ) {
    } 

    /**
    * @dev Update the metadata of a note that already exists in storage. 
    * @param noteHash - hash of a note, used as a unique identifier for the note
    * @param metaData - metadata to update the note with
    */
    function updateNoteMetaData(bytes32 noteHash, bytes memory metaData) public {
        ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);

        // Permissioning check
        bytes32 addressID = keccak256(abi.encodePacked(msg.sender, noteHash));


        // Approve the addresses in the note metaData
        approveAddresses(metaData, noteHash);

        // Set the metaDatatTimeLog to the latest block time
        setMetaDataTimeLog(noteHash);

        emit UpdateNoteMetaData(noteOwner, noteHash, metaData);
    }

}
