pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/IEIP712.sol";

library JoinSplitABIEncoder {
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
     * 0x124:0x144    = m
     * 0x144:0x164    = challenge
     * 0x164:0x184    = publicOwner
     * 0x184:0x1a4    = offset in byte array to notes
     * 0x1a4:0x1c4    = offset in byte array to inputSignatures
     * 0x1c4:0x2e4    = offset in byte array to outputOwners
     * 0x1e4:0x204    = offset in byte array to metadata
     */
    function encodeAndExit(bytes32 domainHash) internal view {
        assembly {
            // set up initial variables
            let notes := add(0x104, calldataload(0x184))
            let n := calldataload(notes)
            let m := calldataload(0x124)
            let outputOwners := add(0x124, calldataload(0x1c4)) // one word after outputOwners = 1st
            let signatures := add(0x124, calldataload(0x1a4)) // one word after signatures = 1st
            let metadata := add(0x144, calldataload(0x1e4)) // two words after metadata = 1st

            // memory map of `proofOutputs`

            // 0x00 - 0x160  = scratch data for EIP712 signature computation and note hash computation
            // ACE_NOTE_SIGNATURE struct hash variables
            // 0x80 = struct hash
            // 0xa0 = proofId (1)
            // 0xc0 = noteHash
            // 0xe0 = challenge
            // 0x100 = sender
            // struct hash of 'ACE_NOTE_SIGNATURE'
            mstore(0x80, 0x6c1a087ea32e7586c4241d8ad29826c79af0e5ae5c44ca4be88caa5a18b99446)
            mstore(0xa0, 0x01)
            mstore(0xe0, calldataload(0x144)) // challenge
            mstore(0x100, calldataload(0x24))

            // EIP712 Signature variables
            // 0x13e - 0x140 = 0x1901
            // 0x140 - 0x160 = domainHash
            // 0x160 - 0x180 = structHash
            mstore(0x120, 0x1901)
            mstore(0x140, domainHash) // domain hash

            // `returndata` starts at 0x160
            // `proofOutputs` starts at 0x180
            // 0x160 - 0x180 = relative offset in returndata to first bytes argument (0x20)
            // 0x180 - 0x1a0 = byte length of `proofOutputs`
            // 0x1a0 - 0x1c0 = number of `proofOutputs` entries (1)
            // 0x1c0 - 0x1e0 = relative memory offset between `v` and start of `proofOutput`

            // `proofOutput` - t, starts at 0x1e0
            // 0x1e0 - 0x200 = length of `proofOutput`
            // 0x200 - 0x220 = relative offset between `t` and `inputNotes`
            // 0x220 - 0x240 = relative offset between `t` and `outputNotes`
            // 0x240 - 0x260 = `publicOwner`
            // 0x260 - 0x280 = `publicValue`

            // `inputNotes` starts at 0x280
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
            mstore(0x1a0, 0x01)                            // number of proofs
            mstore(0x1c0, 0x60)                            // offset to 1st proof
            // length of proofOutput is at s + 0x60
            mstore(0x200, 0xa0)                            // location of inputNotes
            // location of outputNotes is at s + 0xa0
            mstore(0x240, calldataload(0x164))             // publicOwner
            // store kPublic. If kPublic is negative, store correct signed representation,
            // relative to 2^256, not to the order of the bn128 group
            let kPublic := calldataload(sub(add(notes, mul(calldataload(notes), 0xc0)), 0xa0))
            switch gt(kPublic, 10944121435919637611123202872628637544274182200208017171849102093287904247808)
            case 1 {
                mstore(0x260, sub(kPublic, 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001))
            }
            case 0 {
                mstore(0x260, kPublic)
            }

            let inputPtr := 0x280                                 // point to inputNotes
            mstore(add(inputPtr, 0x20), m)                        // number of input notes
            // set note pointer, offsetting lookup indices for each input note
            let s := add(0x2c0, mul(m, 0x20))

            for { let i := 0 } lt(i, m) { i := add(i, 0x01) } {
                let noteIndex := add(add(notes, 0x20), mul(i, 0xc0))
                // get pointer to input signatures
                let signatureIndex := add(signatures, mul(i, 0x60))
                // copy note data to 0x00 - 0x80
                calldatacopy(0x00, add(noteIndex, 0x40), 0x80) // get gamma, sigma

                // construct EIP712 signature parameters
                mstore(0xc0, keccak256(0x00, 0x80)) // note hash
                // construct EIP712 signature message
                mstore(0x160, keccak256(0x80, 0xa0))
                mstore(0x00, keccak256(0x13e, 0x42))
                // recover address of EIP712 signature
                mstore(0x20, and(calldataload(signatureIndex), 0xff)) // get 8-bit v
                calldatacopy(0x40, add(signatureIndex, 0x20), 0x40) // copy r, s into memory

                // store note length in `s`
                mstore(s, 0xa0)
                // store note owner in `s + 0x20`. If ECDSA recovery fails, or signing address is `0`, throw an error
                if or(
                iszero(mload(add(s, 0x20))),
                iszero(staticcall(gas, 0x01, 0x00, 0x80, add(s, 0x20), 0x20))
                ) {
                mstore(0x00, 400) revert(0x00, 0x20)
                }
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
            }

            // transition between input and output notes
            mstore(0x280, sub(sub(s, inputPtr), 0x20)) // store total length of inputNotes at first index of inputNotes 
            mstore(0x220, add(0xa0, sub(s, inputPtr))) // store relative memory offset to outputNotes
            inputPtr := s
            mstore(add(inputPtr, 0x20), sub(n, m)) // store number of output notes
            s := add(s, add(0x40, mul(sub(n, m), 0x20)))

            // output notes
            for { let i := m } lt(i, n) { i := add(i, 0x01) } {
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
            }

            // cleanup. the length of the outputNotes = s - inputPtr
            mstore(inputPtr, sub(sub(s, inputPtr), 0x20)) // store length of outputNotes at start of outputNotes
            let notesLength := sub(s, 0x280)
            mstore(0x1e0, add(0x80, notesLength)) // store length of proofOutput at 0x160
            mstore(0x180, add(0xe0, notesLength)) // store length of proofOutputs at 0x100
            // mstore(0x00 , notesLength) return(0x00, 0x20)
            mstore(0x160, 0x20)
            return(0x160, add(0x120, notesLength)) // return the final byte array
        }
    }
}


contract JoinSplitABIEncoderTest is IEIP712 {

    function validateJoinSplit(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        view 
        returns (bytes memory) 
    {
        JoinSplitABIEncoder.encodeAndExit(EIP712_DOMAIN_HASH);
    }
}
