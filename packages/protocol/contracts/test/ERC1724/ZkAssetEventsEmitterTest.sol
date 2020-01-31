pragma solidity >=0.5.0 <0.6.0;


/**
 * @title ZkAssetEventsEmitterTest
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
contract ZkAssetEventsEmitterTest {

    event ApprovedAddress(address indexed addressApproved, bytes32 indexed noteHash);
    event CreateNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);
    event DestroyNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);
    event UpdateNoteMetaData(address indexed owner, bytes32 indexed noteHash, bytes metadata);


    uint256 public createdNotes = 0;

    function emitCreateNote(address owner, bytes memory metadata, uint256 count) public {
        for (uint i = 0; i<count; i++) {
            createdNotes++;
            emit CreateNote(owner, bytes32(createdNotes), metadata);
        }
    }

    function emitDestroyNote(address owner, bytes memory metadata, uint256 noteIndex) public {
        require(noteIndex <= createdNotes, 'noteIndex must be less or equal to createdNotes');

        emit DestroyNote(owner, bytes32(noteIndex), metadata);
    }

    function emitUpdateNoteMetaData(address owner, bytes memory metadata, uint256 noteIndex) public {
        require(noteIndex <= createdNotes, 'noteIndex must be less or equal to createdNotes');

        emit UpdateNoteMetaData(owner, bytes32(noteIndex), metadata);
    }

}
