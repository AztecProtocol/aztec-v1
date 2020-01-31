pragma solidity >=0.5.0 <0.6.0;


/**
 * @title JoinSplitFluidABIEncoder
 * @author AZTEC
 * @dev
 * Don't include this as an internal library. This contract uses a static memory table to cache
 * elliptic curve primitives and hashes.
 * Calling this internally from another function will lead to memory mutation and undefined behaviour.
 * The intended use case is to call this externally via `staticcall`.
 * External calls to OptimizedAZTEC can be treated as pure functions as this contract contains no
 * storage and makes no external calls (other than to precompiles)
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
library JoinSplitFluidABIEncoder {
    /**
     * Calldata map
     * 0x04:0x24      = calldata location of proofData byte array
     * 0x24:0x44      = message sender
     * 0x44:0x64      = h_x
     * 0x64:0x84      = h_y
     * 0x84:0xa4      = t2_x0
     * 0xa4:0xc4      = t2_x1
     * 0xc4:0xe4      = t2_y0
     * 0xe4:0x104     = t2_y1
     * 0x104:0x124    = length of proofData byte array
     * 0x124:0x144    = challenge
     * 0x144:0x164    = offset in byte array to notes
     * 0x164:0x184    = offset in byte array to inputOwners
     * 0x184:0x1a4    = offset in byte array to outputOwners
     * 0x1a4:0x1c4    = offset in byte array to metadata
     */


    function encodeAndExit() internal pure {
        assembly {
            // set up initial variables
            let notes := add(0x104, calldataload(0x144))
            let n := calldataload(notes)
            let inputOwners := add(0x124, calldataload(0x164)) // one word after input owners = 1st
            let outputOwners := add(0x124, calldataload(0x184)) // one word after outputOwners = 1st
            let metadata := add(0x144, calldataload(0x1a4)) // two words after metadata = 1st

            // memory map of `proofOutputs`

            // `returndata` starts at 0x160
            // `proofOutputs` starts at 0x180
            // 0x160 - 0x180 = relative offset in returndata to first bytes argument (0x20)
            // 0x180 - 0x1a0 = byte length of `proofOutputs`
            // 0x1a0 - 0x1c0 = number of `proofOutputs` entries (2)
            // 0x1c0 - 0x1e0 = relative memory offset between `v` and start of `proofOutput`

            // `proofOutput A` - t, starts at 0x1e0
            // 0x1e0 - 0x200 = length of `proofOutputA`
            // 0x200 - 0x220 = relative offset between `t` and `inputNotes`
            // 0x220 - 0x240 = relative offset between `t` and `outputNotes`
            // 0x240 - 0x260 = `publicOwner`
            // 0x260 - 0x280 = `publicValue`
            // 0x280 - 0x2a0 = `challenge`

            // `inputNotes A` starts at 0x2a0
            // structure of `inputNotes` and `outputNotes`
            // 0x00 - 0x20 = byte length of notes array
            // 0x20 - 0x40 = number of notes `i`
            // the next `i` consecutive blocks of 0x20-sized memory contain relative offset between
            // start of notes array and the location of the `note`

            // `proofOutput B` - r
            // 0x00 - 0x20 = length of `proofOutput B`
            // 0x20 - 0x40 = relative offset between `r` and `inputNotes`
            // 0x40 - 0x60 = relative offset between `r` and `outputNotes`
            // 0x60 - 0x80 = `publicOwner`
            // 0x80 - 0xa0 = `publicValue`
            // 0xa0 - 0xc0 = `challenge`

            // 'inputNotes B'
            // structure of `inputNotes` and `outputNotes`
            // 0x00 - 0x20 = byte length of notes array
            // 0x20 - 0x40 = number of notes `i`
            // the next `i` consecutive blocks of 0x20-sized memory contain relative offset between
            // start of notes array and the location of the `note`

            // structure of a `note`
            // 0x00 - 0x20 = size of `note`
            // 0x20 - 0x40 = `noteType`
            // 0x40 - 0x60 = `owner`
            // 0x60 - 0x80 = `noteHash`
            // 0x80 - 0xa0 = size of note `data`
            // 0xa0 - 0xc0 = compressed note coordinate `gamma` (part of `data`)
            // 0xc0 - 0xe0 = compressed note coordinate `sigma` (part of `data`)
            // 0xe0 - ???? = remaining note metadata

            // `proofOutputs` must form a monolithic block of memory that we can return.
            // `s` points to the memory location of the start of the current note
            // `inputPtr` points to the start of the current `notes` dynamic bytes array

            // length of proofOutputs is at s
            mstore(0x1a0, 0x02)                            // there are two proofOutput objects for a join-split fluid
            mstore(0x1c0, 0x80)                            // offset to 1st proof
            // 0x1e0 = offset to 2nd proof
            // length of proofOutput is at s + 0x60
            mstore(0x220, 0xc0)                            // location of inputNotes
            mstore(0x260, 0x00)                            // publicOwner is 0
            mstore(0x280, 0x00)                            // publicValue is 0

            mstore(0x2a0, calldataload(0x124))

            // set note pointer, offsetting lookup indices for each input note

            /////////////////// PROOF OUTPUT A: START OF INPUT NOTES //////////////////
            // 0x2c0 = number of bytes in `inputNotes` (leave blank for now)
            // 0x2e0 = number of input notes
            mstore(0x2e0, 0x01)

            // 0x300 = relative offset to 1st input note (0x60)
            mstore(0x300, 0x60)

            // Start of inputNote[0]
            // get pointer to metadata
            let metadataIndex := calldataload(metadata)

            // copy note data to 0x20 - 0xa0
            mstore(0x00, 0x01)
            calldatacopy(0x20, add(notes, 0x120), 0x80) // get gamma, sigma

            // store note length in `s` = 0x320
            mstore(0x320, 0xc0)
            // store note type (UXTO type, 0x01) in `s + 0x20`
            mstore(0x340, 0x01)
            // store the owner of the note in `s + 0x40`
            mstore(0x360, calldataload(outputOwners))
            // store note hash
            mstore(0x380, keccak256(0x00, 0xa0))
            // store noteData length in `s + 0x80`
            mstore(0x3a0, 0x40)
            // store compressed note coordinate gamma in `s + 0xa0`
            mstore(
                0x3c0,
                or(
                    mload(0x20),
                    shl(255, and(mload(0x40), 0x01))
                )
            )
            // store compressed note coordinate sigma in `s + 0xc0`
            mstore(
                0x3e0,
                or(
                    mload(0x60),
                    shl(255, and(mload(0x80), 0x01))
                )
            )
            // inputNote, so no metaData to store

            // store relative memory offset to outputNotes
            mstore(0x240, 0x200)
            // store the length of inputNotes at 0x2c0
            mstore(0x2c0, 0x120)
            ///////////////// PROOF OUTPUT A: START OF OUTPUT NOTES (1) ///////////////////

            // transition between input and output notes

            // 0x400 + metadataLength = byte length of output notes (0x120)
            // 0x420 + metadataLength = # of output notes (1)
            // 0x440 + metadataLength = offset to outputNotes[0] (0x60)
            let metadataLength := calldataload(add(metadataIndex, sub(metadata, 0x40)))

            mstore(0x400, add(0x120, metadataLength)) // store length of output notes
            mstore(0x420, 0x01) // store number of output notes
            mstore(0x440, 0x60) // store offset to outputNotes[0]

            // construct note hash
            // copy 1st note note to 0x20 - 0xa0
            calldatacopy(0x20, add(notes, 0x60), 0x80) // get gamma, sigma

            // store note length in `s`
            mstore(0x460, add(0xc0, metadataLength))
            // store note type (UXTO type, 0x01) in `s + 0x20`
            mstore(0x480, 0x01)
            // store note owner in `s + 0x40`
            mstore(0x4a0, calldataload(inputOwners))
            // store note hash in `s + 0x60`
            mstore(0x4c0, keccak256(0x00, 0xa0))
            // store note metadata length in `s + 0x80` (just the coordinates)
            mstore(0x4e0, add(0x40, metadataLength))
            // store compressed note coordinate gamma in `s + 0xa0`
            mstore(
                0x500,
                or(
                    mload(0x20),
                    shl(255, and(mload(0x40), 0x01))
                )
            )
            // store compressed note coordinate sigma in `s + 0xc0`
            mstore(
                0x520,
                or(
                    mload(0x60),
                    shl(255, and(mload(0x80), 0x01))
                )
            )

            calldatacopy(0x540, add(metadataIndex, sub(metadata, 0x20)), metadataLength)

            // compute the relative offset to index this note in our returndata
            mstore(add(0x440, 0), 0x60) // relative offset to note

            // now we need to transition between first and second proofOutput
            // s is going to point to the end of the outputNotes array
            // so, s is our absolute pointer to the start of the 2nd proofOutputs entry
            // we know that 'proofOutputs' starts at 0x180
            // so (s - 0x180) = relative offset to second proofOutputs entry
            let startOfProofOutput := add(0x540, metadataLength)

            // proofOutput[0].length = start of proofOutput[1] - start of proofOutput[0] - 0x20
            // proofOutput[0].length = (0x540 + metadataLength) - 0x200 - 0x20 = 0x320 + metadataLength
            mstore(0x200, add(0x320, metadataLength)) // length of proofOutput
            mstore(0x1e0, add(0x3c0, metadataLength)) // offset to get to second proofOutput

            // s points to the start of proofOutputs[0]
            let s := startOfProofOutput
            mstore(add(s, 0x20), 0xc0)   // location of inputNotes
            mstore(add(s, 0x40), 0x100)  // location of outputNotes
            mstore(add(s, 0x60), 0x00)   // publicOwner
            mstore(add(s, 0x80), 0x00)   // publicValue

            // compute challenge = kecck256(challenge)
            mstore(0x20, calldataload(0x124))
            mstore(add(s, 0xa0), keccak256(0x20, 0x20)) // challenge
            // 0x00 length of proofOutput
            // 0x20 location of inputNotes
            // 0x40 location of outputNotes
            // 0x60 publicOwner
            // 0x80 publicValue
            // 0xa0 = inputNoteData
            mstore(add(s, 0xc0), 0x20) // length of input notes array (1 word)
            mstore(add(s, 0xe0), 0x00) // number of entries (0 words)

            // set notesPtr = proofOutputs[1].outputNotes
            let notesPtr := add(s, 0x100)

            // s + 0x20 = number of notes = n - 2
            mstore(add(notesPtr, 0x20), sub(n, 2))

            // set s to point to proofOutputs[1].outputNotes[0]
            s := add(add(s, 0x140), mul(0x20, sub(n, 2)))

            // Output notes:
            // first output note needs to go into the first proofOutput object
            // second output note onwards, needs to go into the second proofOutput object
            for { let i := 0x02 } lt(i, n) { i := add(i, 0x01) } {

            /////////////////// START OF PROOF OUTPUT B  ////////////////////

                // get pointer to metadata
                metadataIndex := calldataload(add(metadata, mul(sub(i, 0x01), 0x20)))
                // get size of metadata
                metadataLength := calldataload(add(sub(metadata, 0x40), metadataIndex))

                mstore(0x00, 0x01)
                // copy note data to 0x20 - 0xa0
                calldatacopy(
                    0x20,
                    add(add(notes, 0x60), mul(i, 0xc0)),
                    0x80
                ) // get gamma, sigma

                // store note length in `s`
                mstore(s, add(0xc0, metadataLength))
                // store note type (UXTO type, 0x01) in `s + 0x20`
                mstore(add(s, 0x20), 0x01)
                // store the owner of the note in `s + 0x40`
                mstore(add(s, 0x40), calldataload(add(outputOwners, mul(sub(i, 0x01), 0x20))))
                // store note hash
                mstore(add(s, 0x60), keccak256(0x00, 0xa0))
                // store note metadata length if `s + 0x80`
                mstore(add(s, 0x80), add(0x40, metadataLength))
                // store compressed note coordinate gamma in `s + 0xa0`
                mstore(
                    add(s, 0xa0),
                    or(
                        mload(0x20),
                        shl(255, and(mload(0x40), 0x01))
                    )
                )
                // store compressed note coordinate sigma in `s + 0xc0`
                mstore(
                    add(s, 0xc0),
                    or(
                        mload(0x60),
                        shl(255, and(mload(0x80), 0x01))
                    )
                )
                // copy metadata into `s + 0xe0`
                calldatacopy(add(s, 0xe0), add(metadataIndex, sub(metadata, 0x20)), metadataLength)
                // compute the relative offset to index this note in our returndata
                mstore(add(notesPtr, mul(i, 0x20)), sub(s, notesPtr)) // relative offset to note

                // increase s by note length
                s := add(s, add(mload(s), 0x20))
            }

            // inputPtr used to point to start of inputNotes for proofOutputs[0]
            // now we want inputPtr to point to start of inputNotes for proofOutputs[1]
            // 1. length of proofOutput
            // 2. length of outputNotes
            // length of outputNotes = s - inputPtr, stored at inputPtr
            mstore(notesPtr, sub(sub(s, notesPtr), 0x20)) // store length of outputNotes at start of outputNotes
            // length of proofOutput
            let proofOutputLength := sub(s, startOfProofOutput)
            mstore(startOfProofOutput, sub(proofOutputLength, 0x20))
            mstore(0x180, sub(s, 0x1a0)) // store length of proofOutputs at 0x100
            mstore(0x160, 0x20)
            return(0x160, sub(s, 0x160)) // return the final byte array
        }
    }
}
