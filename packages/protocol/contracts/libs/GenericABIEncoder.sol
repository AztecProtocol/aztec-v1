pragma solidity >=0.5.0 <0.6.0;

 /**
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
library GenericABIEncoder {

    uint private constant NOTE_TYPE = 1;


    function encodeProofOutputsOne(
        uint noteInfo,
        uint publicOwner,
        uint publicValue
    ) public pure returns (bytes memory) {
        assembly {
            mstore(0x160, 0x20)
            // 0x180 = size of proofOutputs in bytes
            mstore(0x1a0, 0x01) // number of proof outputs
            mstore(0x1c0, 0x60) // relative offset to start of proofOutputs
        }
        uint size = 0x80 + encodeProofOutput(
            0x1e0,
            (noteInfo & 0xff),
            (noteInfo >> 8) & 0xff,
            (noteInfo >> 16) & 0xffff,
            (noteInfo >> 32) & 0xffff,
            (noteInfo >> 48) & 0xffff,
            publicOwner,
            publicValue
        );
        assembly {
            mstore(0x180, sub(size, 0x40))
            return(0x160, size)
        }
    }

    function encodeProofOutput(
        uint freePtr,
        uint numNotes,
        uint numInputNotes,
        uint offsetToNotes,
        uint ownerPtr,
        uint metadataPtr,
        uint publicOwner,
        uint publicValue
    ) internal pure returns (uint proofOutputSize) {
        assembly {
            // memory map of proofOutput
            // 0x00 - 0x20 - byte length
            // 0x20 - 0x40 - offset to inputNotes
            // 0x40 - 0x60 - offset to outputNotes
            // 0x60 - 0x80 - publicOnwner
            // 0x80 - 0xa0 - publicValue
            mstore(add(freePtr, 0x20), 0xa0)
            mstore(add(freePtr, 0x60), publicOwner)
            mstore(add(freePtr, 0x80), publicValue)
            proofOutputSize := encodeInputNotes(
                add(freePtr, 0xa0),
                numInputNotes,
                add(offsetToNotes, 0x20),
                ownerPtr
            )
           
            mstore(add(freePtr, 0x40), add(proofOutputSize, 0xa0))

            proofOutputSize := add(
                proofOutputSize,
                encodeOutputNotes(
                    add(add(freePtr, 0xa0), proofOutputSize),
                    sub(numNotes, numInputNotes),
                    add(offsetToNotes, mul(numInputNotes, 0xc0)),
                    add(ownerPtr, mul(numInputNotes, 0x20)),
                    add(metadataPtr, mul(numInputNotes, 0x20))
                )
            )
            proofOutputSize := add(proofOutputSize, 0xa0)
            mstore(freePtr, sub(proofOutputSize, 0x20))

            function encodeInputNotes(memPtr, len, notePtr, ownerPtr) -> inputNotesLength {
                mstore(0x00, 0x01)
                // memory map for input notes
                // 0x00 - 0x20 - byte length
                // 0x20 - 0x40 - number of notes
                // 0x40 - xxxx - offsets to note entries
                mstore(add(memPtr, 0x20), len) // length of input notes
                
                notePtr := add(memPtr, add(0x40, mul(len, 0x20)))
                for { let i := 0 } lt(i, len) { i := add(i, 0x01) } {
                    // write the relative offset to this note entry
                    mstore(add(0x40, add(memPtr, mul(i, 0x20))), sub(notePtr, memPtr))

                    let noteIndex := add(notePtr, mul(i, 0xc0))
                    // copy notes
                    calldatacopy(0x20, noteIndex, 0x80)

                    mstore(notePtr, 0xc0) // length of note
                    mstore(add(notePtr, 0x20), 0x01) // note type
                    mstore(add(notePtr, 0x40), calldataload(add(ownerPtr, mul(i, 0xc0)))) // note owner
                    mstore(add(notePtr, 0x60), keccak256(0x00, 0xa0)) // note hash
                    mstore(add(notePtr, 0x80), 0x40) // metadata length
                    mstore(             // gamma
                        add(notePtr, 0xa0),
                        or(
                            mload(0x20),
                            mul(
                            and(mload(0x40), 0x01),
                            0x8000000000000000000000000000000000000000000000000000000000000000
                            )
                        )
                    )
                    // store compressed note coordinate sigma in `s + 0xa0`
                    mstore(
                        add(notePtr, 0xc0),
                        or(
                            mload(0x60),
                            mul(
                            and(mload(0x80), 0x01),
                            0x8000000000000000000000000000000000000000000000000000000000000000
                            )
                        )
                    )

                    notePtr := add(notePtr, 0xe0)
                }

                mstore(memPtr, sub(sub(notePtr, memPtr), 0x20)) // store input note length at memPtr
                inputNotesLength := sub(notePtr, memPtr)
            }

            function encodeOutputNotes(memPtr, len, notePtr, ownerPtr, metadataPtr) -> outputNotesLength {
                mstore(0x00, 0x01)
                // memory map for input notes
                // 0x00 - 0x20 - byte length
                // 0x20 - 0x40 - number of notes
                // 0x40 - xxxx - offsets to note entries
                mstore(add(memPtr, 0x20), len) // length of output notes
                
                notePtr := add(memPtr, add(0x40, mul(len, 0x20)))
                for { let i := 0 } lt(i, len) { i := add(i, 0x01) } {
                    // write the relative offset to this note entry
                    mstore(add(0x40, add(memPtr, mul(i, 0x20))), sub(notePtr, memPtr))

                    let noteIndex := add(notePtr, mul(i, 0xc0))
                    let metadataIndex := calldataload(add(metadataPtr, add(0x20, mul(i, 0x20))))
                    let metadataLength := calldataload(add(sub(metadataPtr, 0x40), metadataIndex))

                    // copy notes
                    calldatacopy(0x20, noteIndex, 0x80)

                    mstore(notePtr, 0xc0) // length of note
                    mstore(add(notePtr, 0x20), 0x01) // note type
                    mstore(add(notePtr, 0x40), calldataload(add(ownerPtr, mul(i, 0xc0)))) // note owner
                    mstore(add(notePtr, 0x60), keccak256(0x00, 0xa0)) // note hash
                    mstore(add(notePtr, 0x80), add(0x40, metadataLength)) // metadata length
                    mstore(             // gamma
                        add(notePtr, 0xa0),
                        or(
                            mload(0x20),
                            mul(
                            and(mload(0x40), 0x01),
                            0x8000000000000000000000000000000000000000000000000000000000000000
                            )
                        )
                    )
                    // store compressed note coordinate sigma in `s + 0xa0`
                    mstore(
                        add(notePtr, 0xc0),
                        or(
                            mload(0x60),
                            mul(
                            and(mload(0x80), 0x01),
                            0x8000000000000000000000000000000000000000000000000000000000000000
                            )
                        )
                    )
                    calldatacopy(
                        add(notePtr, 0xe0),
                        add(metadataIndex, sub(metadataPtr, 0x20)),
                        metadataLength
                    )

                    notePtr := add(notePtr, add(0xe0, metadataLength))
                }

                mstore(memPtr, sub(sub(notePtr, memPtr), 0x20)) // store input note length at memPtr
                outputNotesLength := sub(notePtr, memPtr)
            }

        }
    }
}
