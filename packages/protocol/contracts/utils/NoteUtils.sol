pragma solidity >=0.5.0 <0.6.0;

library NoteUtils {

    function getLength(bytes memory proofOutputsOrNotes) internal pure returns (
        uint len
    ) {
        assembly {
            len := mload(add(proofOutputsOrNotes, 0x20))
        }
    }

    function get(bytes memory proofOutputsOrNotes, uint i) internal pure returns (
        bytes memory out
    ) {
        assembly {
            let base := add(add(proofOutputsOrNotes, 0x40), mul(i, 0x20))
            out := add(proofOutputsOrNotes, mload(base))
        }
    }

    function extractProofOutput(bytes memory proofOutput) internal pure returns (
        bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue
    ) {
        assembly {
            inputNotes := add(proofOutput, mload(add(proofOutput, 0x20)))
            outputNotes := add(proofOutput, mload(add(proofOutput, 0x40)))
            publicOwner := mload(add(proofOutput, 0x60))
            publicValue := mload(add(proofOutput, 0x80))
        }
    }

    function extractNote(bytes memory note) internal pure returns (
            address owner,
            bytes32 noteHash,
            bytes memory metadata
        ) {
        assembly {
            owner := mload(add(note, 0x20))
            noteHash := mload(add(note, 0x40))
            metadata := add(note, 0x60)
        }
    }

    function hashProofOutput(bytes memory proofOutput) internal pure returns (
        bytes32 proofHash
    ) {
        assembly {
            let len := add(mload(proofOutput), 0x20)
            proofHash := keccak256(proofOutput, len)
        }
    }
}
