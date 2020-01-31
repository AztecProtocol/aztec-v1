pragma solidity >=0.5.0 <0.6.0;

/**
 * @title NoteUtils
 * @author AZTEC
 * @dev NoteUtils is a utility library that extracts user-readable information from AZTEC proof outputs.
 *      Specifically, `bytes proofOutput` objects can be extracted from `bytes proofOutputs`,
 *      `bytes proofOutput` and `bytes note` can be extracted into their constituent components,
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
library NoteUtils {

    /**
    * @dev Get the number of entries in an AZTEC-ABI array (bytes proofOutputs, bytes inputNotes, bytes outputNotes)
    *      All 3 are rolled into a single function to eliminate 'wet' code - the implementations are identical
    * @param _proofOutputsOrNotes `proofOutputs`, `inputNotes` or `outputNotes`
    * @return number of entries in the pseudo dynamic array
    */
    function getLength(bytes memory _proofOutputsOrNotes) internal pure returns (
        uint len
    ) {
        assembly {
            // first word = the raw byte length
            // second word = the actual number of entries (hence the 0x20 offset)
            len := mload(add(_proofOutputsOrNotes, 0x20))
        }
    }

    /**
    * @dev Get a bytes object out of a dynamic AZTEC-ABI array
    * @param _proofOutputsOrNotes `proofOutputs`, `inputNotes` or `outputNotes`
    * @param _i the desired entry
    * @return number of entries in the pseudo dynamic array
    */
    function get(bytes memory _proofOutputsOrNotes, uint _i) internal pure returns (
        bytes memory out
    ) {
        bool valid;
        assembly {
            // check that i < the number of entries
            valid := lt(
                _i,
                mload(add(_proofOutputsOrNotes, 0x20))
            )
            // memory map of the array is as follows:
            // 0x00 - 0x20 : byte length of array
            // 0x20 - 0x40 : n, the number of entries
            // 0x40 - 0x40 + (0x20 * i) : relative memory offset to start of i'th entry (i <= n)

            // Step 1: compute location of relative memory offset: _proofOutputsOrNotes + 0x40 + (0x20 * i) 
            // Step 2: loaded relative offset and add to _proofOutputsOrNotes to get absolute memory location
            out := add(
                mload(
                    add(
                        add(_proofOutputsOrNotes, 0x40),
                        mul(_i, 0x20)
                    )
                ),
                _proofOutputsOrNotes
            )
        }
        require(valid, "AZTEC array index is out of bounds");
    }

    /**
    * @dev Extract constituent elements of a `bytes _proofOutput` object
    * @param _proofOutput an AZTEC proof output
    * @return inputNotes, AZTEC-ABI dynamic array of input AZTEC notes
    * @return outputNotes, AZTEC-ABI dynamic array of output AZTEC notes
    * @return publicOwner, the Ethereum address of the owner of any public tokens involved in the proof
    * @return publicValue, the amount of public tokens involved in the proof
    *         if (publicValue > 0), this represents a transfer of tokens from ACE to publicOwner
    *         if (publicValue < 0), this represents a transfer of tokens from publicOwner to ACE
    */
    function extractProofOutput(bytes memory _proofOutput) internal pure returns (
        bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue
    ) {
        assembly {
            // memory map of a proofOutput:
            // 0x00 - 0x20 : byte length of proofOutput
            // 0x20 - 0x40 : relative offset to inputNotes
            // 0x40 - 0x60 : relative offset to outputNotes
            // 0x60 - 0x80 : publicOwner
            // 0x80 - 0xa0 : publicValue
            // 0xa0 - 0xc0 : challenge
            inputNotes := add(_proofOutput, mload(add(_proofOutput, 0x20)))
            outputNotes := add(_proofOutput, mload(add(_proofOutput, 0x40)))
            publicOwner := and(
                mload(add(_proofOutput, 0x60)),
                0xffffffffffffffffffffffffffffffffffffffff
            )
            publicValue := mload(add(_proofOutput, 0x80))
        }
    }

    /**
    * @dev Extract the challenge from a bytes proofOutput variable
    * @param _proofOutput bytes proofOutput, outputted from a proof validation smart contract
    * @return bytes32 challenge - cryptographic variable that is part of the sigma protocol
    */
    function extractChallenge(bytes memory _proofOutput) internal pure returns (
        bytes32 challenge
    ) {
        assembly {
            challenge := mload(add(_proofOutput, 0xa0))
        }
    }

    /**
    * @dev Extract constituent elements of an AZTEC note
    * @param _note an AZTEC note
    * @return owner, Ethereum address of note owner
    * @return noteHash, the hash of the note's public key
    * @return metadata, note-specific metadata (contains public key and any extra data needed by note owner)
    */
    function extractNote(bytes memory _note) internal pure returns (
            address owner,
            bytes32 noteHash,
            bytes memory metadata
    ) {
        assembly {
            // memory map of a note:
            // 0x00 - 0x20 : byte length of note
            // 0x20 - 0x40 : note type
            // 0x40 - 0x60 : owner
            // 0x60 - 0x80 : noteHash
            // 0x80 - 0xa0 : start of metadata byte array
            owner := and(
                mload(add(_note, 0x40)),
                0xffffffffffffffffffffffffffffffffffffffff
            )
            noteHash := mload(add(_note, 0x60))
            metadata := add(_note, 0x80)
        }
    }
    
    /**
    * @dev Get the note type
    * @param _note an AZTEC note
    * @return noteType
    */
    function getNoteType(bytes memory _note) internal pure returns (
        uint256 noteType
    ) {
        assembly {
            noteType := mload(add(_note, 0x20))
        }
    }
}
