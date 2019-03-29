pragma solidity >=0.5.0 <0.6.0;

import "../../../libs/LibEIP712.sol";

library AdjustSupplyABIEncoder {
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
            let m := 1
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

            // `inputNotes A` starts at 0x280
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

            // 'inputNotes B'
            // structure of `inputNotes` and `outputNotes`
            // 0x00 - 0x20 = byte length of notes array
            // 0x20 - 0x40 = number of notes `i`
            // the next `i` consecutive blocks of 0x20-sized memory contain relative offset between
            // start of notes array and the location of the `note`

            // structure of a `note`
            // 0x00 - 0x20 = size of `note`
            // 0x20 - 0x40 = `owner`
            // 0x40 - 0x60 = `noteHash`
            // 0x60 - 0x80 = size of note `data`
            // 0x80 - 0xa0 = compressed note coordinate `gamma` (part of `data`)
            // 0xa0 - 0xc0 = compressed note coordinate `sigma` (part of `data`)
            // 0xc0 - ???? = remaining note metadata

            // `proofOutputs` must form a monolithic block of memory that we can return.
            // `s` points to the memory location of the start of the current note
            // `inputPtr` points to the start of the current `notes` dynamic bytes array

            // length of proofOutputs is at s
            mstore(0x1a0, 0x02)                            // there are two proofOutput objects for an adjustSupply
            mstore(0x1c0, 0x80)                            // offset to 1st proof
            // 0x1e0 = offset to 2nd proof
            // length of proofOutput is at s + 0x60
            mstore(0x220, 0xa0)                            // location of inputNotes
            mstore(0x260, 0x00)                            // publicOwner is 0

            let kPublic := 0
            mstore(0x280, kPublic)

            let inputPtr := 0x2a0                                 // point to inputNotes
            mstore(add(inputPtr, 0x20), m)                        // number of input notes
            // set note pointer, offsetting lookup indices for each input note
            let s := add(0x2e0, mul(m, 0x20))

            /////////////////// PROOF OUTPUT A: START OF INPUT NOTES //////////////////
            let i := 0x01
            // get note index
            let noteIndex := add(add(notes, 0x20), mul(i, 0xc0))
            // get pointer to metadata
            let metadataIndex := calldataload(add(metadata, mul(sub(i, m), 0x20)))
            // get size of metadata
            let metadataLength := calldataload(add(sub(metadata, 0x40), metadataIndex))

            // copy note data to 0x00 - 0x80
            calldatacopy(0x00, add(noteIndex, 0x40), 0x80) // get gamma, sigma

            // store note length in `s`
            mstore(s, add(0xa0, metadataLength))
            // store the owner of the note in `s + 0x20`
            mstore(add(s, 0x20), calldataload(add(outputOwners, mul(sub(i, m), 0x20))))
            // store note hash
            mstore(add(s, 0x40), keccak256(0x00, 0x80))
            // store note metadata length if `s + 0x60`
            mstore(add(s, 0x60), add(0x40, metadataLength))
            // store compressed note coordinate gamma in `s + 0x80`
            mstore(
                add(s, 0x80),
                or(
                    mload(0x00),
                    mul(
                        and(mload(0x20), 0x01),
                        0x8000000000000000000000000000000000000000000000000000000000000000
                    )
                )
            )
            // store compressed note coordinate sigma in `s + 0xa0`
            mstore(
            add(s, 0xa0),
            or(
                mload(0x40),
                mul(
                    and(mload(0x60), 0x01),
                    0x8000000000000000000000000000000000000000000000000000000000000000
                )
            )
            )
            // copy metadata into `s + 0xc0`
            calldatacopy(add(s, 0xc0), add(metadataIndex, sub(metadata, 0x20)), metadataLength)
            // compute the relative offset to index this note in our returndata
            mstore(add(add(inputPtr, 0x40), mul(sub(i, m), 0x20)), sub(s, inputPtr)) // relative offset to note

            // increase s by note length
            s := add(s, add(mload(s), 0x20))

            ///////////////// PROOF OUTPUT A: START OF OUTPUT NOTES (1) ///////////////////

            // transition between input and output notes
            // 0x2a0 = inputPtr = the pointer to the start of inputNotes
            // s = pointer to the 'next' input note
            // s - inputPtr = byte length between start and end of inputNotes
            // 0xa0 + (s - inputPtr) = byte length between start of 'proofOutput' and end of input notes
            // start of outputNotes = end of inputNotes
            mstore(0x2a0, sub(sub(s, inputPtr), 0x20)) // store total length of inputNotes at first index of inputNotes 
            mstore(0x240, add(0xa0, sub(s, inputPtr))) // store relative memory offset to outputNotes
            inputPtr := s
            mstore(add(inputPtr, 0x20), 0x01) // store number of output notes
            // we want s to point to the first data entry in outputNotes
            // add 0x40 to skip over 'number of bytes in array' and 'number of entries in array'
            // add (x * 0x20) to skip over the relative offsets to each data bloack
            s := add(s, add(0x40, mul(0x01, 0x20)))
            
            i := 0
            noteIndex := add(add(notes, 0x20), mul(i, 0xc0))

            // copy note data to 0x00 - 0x80
            calldatacopy(0x00, add(noteIndex, 0x40), 0x80) // get gamma, sigma

            // construct note hash
            mstore(0xc0, keccak256(0x00, 0x80))

            // store note length in `s`
            mstore(s, 0xa0)

            // store note owner in `s + 0x20`
            mstore(add(s, 0x20), calldataload(inputOwners))
            // store note hash in `s + 0x40`
            mstore(add(s, 0x40), mload(0xc0))
            // store note metadata length in `s + 0x60` (just the coordinates)
            mstore(add(s, 0x60), 0x40)
            // store compressed note coordinate gamma in `s + 0x80`
            mstore(
            add(s, 0x80),
            or(
                calldataload(add(noteIndex, 0x40)),
                mul(
                and(calldataload(add(noteIndex, 0x60)), 0x01),
                0x8000000000000000000000000000000000000000000000000000000000000000
                )
            )
            )
            // store compressed note coordinate sigma in `s + 0xa0`
            mstore(
            add(s, 0xa0),
            or(
                calldataload(add(noteIndex, 0x80)),
                mul(
                and(calldataload(add(noteIndex, 0xa0)), 0x01),
                0x8000000000000000000000000000000000000000000000000000000000000000
                )
            )
            )
            // compute the relative offset to index this note in our returndata
            mstore(add(add(inputPtr, 0x40), mul(i, 0x20)), sub(s, inputPtr)) // relative offset to note
    
            // increase s by note length
            s := add(s, 0xc0)

            // now we need to transition between first and second proofOutput
            // s is going to point to the end of the outputNotes array
            // so, s is our absolute pointer to the start of the 2nd proofOutputs entry
            // we know that 'proofOutputs' starts at 0x180
            // so (s - 0x180) = relative offset to second proofOutputs entry
            let startOfProofOutput := s
            mstore(0x200, sub(s, 0x220)) // length of proofOutput
            mstore(0x1e0, sub(s, 0x180)) // offset to get to second proofOutput
            mstore(inputPtr, sub(s, add(inputPtr, 0x20)))
            mstore(add(s, 0x20), 0xa0)
            mstore(add(s, 0x40), 0xe0)
            mstore(add(s, 0x60), 0x00)
            mstore(add(s, 0x80), 0x00)
            // 0x00 length of proofOutput
            // 0x20 location of inputNotes
            // 0x40 location of outputNotes
            // 0x60 publicOwner
            // 0x80 publicValue
            // 0xa0 = inputNoteData
            mstore(add(s, 0xa0), 0x20) // length of input notes array (1 word)
            mstore(add(s, 0xc0), 0x00) // number of entries (0 words)
            
            // 0xe0 = start of output notes
            // inside inputNote
            // 0x00 = byte length
            // 0x20 = number of notes
            // 0x40 = 
            s := add(s, 0xe0)
            // now s = start of output notes
            // we don't know the length
            // but we do know that the number of notes = n - 2
            mstore(add(s, 0x20), sub(n, 2))
            inputPtr := s
            // we want to point s to first outputNote data
            // want to add 0x40 + (0x20 * number of output notes)
            s := add(s, add(0x40, mul(0x20, sub(n, 2))))
            // now s points to output note data!
            m := add(m, 0x01)
            // the number of output n
            // Output notes:
            // first output note needs to go into the first proofOutput object
            // second output note onwards, needs to go into the second proofOutput object
            for { i := m } lt(i, n) { i := add(i, 0x01) } {

            /////////////////// START OF PROOF OUTPUT B  ////////////////////

                // get note index
                noteIndex := add(add(notes, 0x20), mul(i, 0xc0))
                // get pointer to metadata
                metadataIndex := calldataload(add(metadata, mul(sub(i, sub(m, 0x01)), 0x20)))
                // get size of metadata
                metadataLength := calldataload(add(sub(metadata, 0x40), metadataIndex))

                // copy note data to 0x00 - 0x80
                calldatacopy(0x00, add(noteIndex, 0x40), 0x80) // get gamma, sigma

                // store note length in `s`
                mstore(s, add(0xa0, metadataLength))
                // store the owner of the note in `s + 0x20`
                mstore(add(s, 0x20), calldataload(add(outputOwners, mul(sub(i, sub(m, 0x01)), 0x20))))
                // store note hash
                mstore(add(s, 0x40), keccak256(0x00, 0x80))
                // store note metadata length if `s + 0x60`
                mstore(add(s, 0x60), add(0x40, metadataLength))
                // store compressed note coordinate gamma in `s + 0x80`
                mstore(
                    add(s, 0x80),
                    or(
                        mload(0x00),
                        mul(
                            and(mload(0x20), 0x01),
                            0x8000000000000000000000000000000000000000000000000000000000000000
                        )
                    )
                )
                // store compressed note coordinate sigma in `s + 0xa0`
                mstore(
                add(s, 0xa0),
                or(
                    mload(0x40),
                    mul(
                        and(mload(0x60), 0x01),
                        0x8000000000000000000000000000000000000000000000000000000000000000
                    )
                )
                )
                // copy metadata into `s + 0xc0`
                calldatacopy(add(s, 0xc0), add(metadataIndex, sub(metadata, 0x20)), metadataLength)
                // compute the relative offset to index this note in our returndata
                mstore(add(add(inputPtr, 0x40), mul(sub(i, m), 0x20)), sub(s, inputPtr)) // relative offset to note

                // increase s by note length
                s := add(s, add(mload(s), 0x20))
            }

            // inputPtr used to point to start of inputNotes for proofOutputs[0]
            // now we want inputPtr to point to start of inputNotes for proofOutputs[1]
            // 1. length of proofOutput
            // 2. length of outputNotes
            // length of outputNotes = s - inputPtr, stored at inputPtr
            mstore(inputPtr, sub(sub(s, inputPtr), 0x20)) // store length of outputNotes at start of outputNotes
            // length of proofOutput
            let proofOutputLength := sub(s, startOfProofOutput)
            mstore(startOfProofOutput, sub(proofOutputLength, 0x20))
            let notesLength := sub(s, 0x280)
            mstore(0x180, sub(s, 0x1a0)) // store length of proofOutputs at 0x100
            // mstore(0x00 , notesLength) return(0x00, 0x20)
            mstore(0x160, 0x20)
            return(0x160, sub(s, 0x160)) // return the final byte array
        }
    }
}

contract AdjustSupplyABIEncoderTest is LibEIP712 {

    function validateAdjustSupply(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        view 
        returns (bytes memory) 
    {
        AdjustSupplyABIEncoder.encodeAndExit();
    }
}
