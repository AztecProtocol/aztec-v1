pragma solidity 0.4.24;


library NoteUtilities {

    function length(bytes memory proofOutputsOrNotes) internal view returns (uint len) {
        assembly {
            len := mload(add(proofOutputsOrNotes, 0x20))
        }
    }

    function get(bytes memory proofOutputsOrNotes, uint i) internal view returns (bytes out) {
        assembly {
            let base := add(add(proofOutputsOrNotes, 0x40), mul(i, 0x20))
            out := add(proofOutputsOrNotes, mload(base))
        }
    }

    function extractProofOutput(bytes memory proofOutput) internal view returns (
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

    function extractNote(bytes memory note) internal view returns (
        address owner,
        bytes32 noteHash,
        bytes memory metadata
    ) {
        assembly {
            owner := mload(add(note, 0x20))
            noteHash := mload(add(note, 0x40))
            metadata := add(note, mload(add(note, 0x60)))
        }
    }
}


/**
 * @title The AZTEC Cryptography Engine
 * @author AZTEC
 * @dev ACE validates the AZTEC protocol's family of zero-knowledge proofs,
 * which allows digital asset builders to construct fungible confidential digital assets
 * according to the AZTEC token standard.
 **/
contract ACE {
    bytes32[6] public commonReferenceString;
    address public owner;
    mapping(uint16 => address) public validators;
    mapping(uint16 => bool) private balancedProofs;
    mapping(bytes32 => bool) private validatedProofs;

    event LogSetProof(uint16 _proofType, address _validatorAddress, bool _isBalanced);
    event LogSetCommonReferenceString(bytes32[6] _commonReferenceString);

    constructor () {
        owner = msg.sender;
    }

    function validateProof(uint16 _proofType, bytes) external returns (
        bytes memory proofData
    ) {
        address validatorAddress = validators[_proofType];
        require(validatorAddress != address(0), "expect validator address to exist");
        
        assembly {
            let _proofData := 0x24
            let m := mload(0x40)
            mstore(add(m, 0x04), 0x104)
            mstore(add(m, 0x24), caller)
            mstore(add(m, 0x44), sload(commonReferenceString_slot))
            mstore(add(m, 0x64), sload(add(0x01, commonReferenceString_slot)))
            mstore(add(m, 0x84), sload(add(0x02, commonReferenceString_slot)))
            mstore(add(m, 0xa4), sload(add(0x03, commonReferenceString_slot)))
            mstore(add(m, 0xc4), sload(add(0x04, commonReferenceString_slot)))
            mstore(add(m, 0xe4), sload(add(0x05, commonReferenceString_slot)))
            calldatacopy(add(m, 0x104), _proofData, calldataload(_proofData))
            if iszero(staticcall(gas, validatorAddress, m, add(calldataload(_proofData), 0x104), 0x00, 0x00)) {
                mstore(0x00, 400)
                return(0x00, 0x20)
            }
            returndatacopy(m, 0x00, returndatasize)
            let outputData := m
            m := add(m, returndatasize)

            mstore(0x00, _proofType)
            mstore(0x20, balancedProofs_slot)
            switch sload(keccak256(0x00, 0x40))
            case 1 {
                let numProofOutputs := mload(add(outputData, 0x20))
                for { let i := 0 } lt(i, numProofOutputs) { i := add(i, 0x01) } {
                    let loc := add(add(outputData, 0x40), mul(i, 0x20))
                    let proofHash := keccak256(loc, add(mload(loc), 0x20))
                    mstore(m, proofHash)
                    mstore(add(m, 0x20), _proofType)
                    mstore(add(m, 0x40), caller)
                    mstore(0x00, keccak256(m, 0x60))
                    mstore(0x20, validatedProofs_slot)
                    sstore(keccak256(0x00, 0x40), 0x01)
                }
            }
            return(outputData, returndatasize)
        }
    }

    function clearProofByHashes(uint16 _proofType, bytes32[]) external {
        assembly {
            let m := mload(0x40)
            let proofHashes := 0x24
            let length := calldataload(proofHashes)
            mstore(m, _proofType)
            mstore(0x20, validatedProofs_slot)
            mstore(add(m, 0x40), caller)
            for { let i := 0 } lt(i, length) { i := add(i, 0x01) } {
                let proofHash := calldataload(add(add(proofHashes, mul(i, 0x20)), 0x20))
                switch iszero(proofHash)
                case 1 {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }
                mstore(add(m, 0x20), proofHash)
                mstore(0x00, keccak256(m, 0x60))
                sstore(keccak256(0x00, 0x40), 0x00)
            }
        }
    }

    function validateProofByHash(uint16 _proofType, bytes32 _proofHash, address _sender) external view returns (bool) {
        assembly {
            let m := mload(0x40)
            mstore(m, _proofType)
            mstore(add(m, 0x20), _proofHash)
            mstore(add(m, 0x40), _sender)
            mstore(0x00, keccak256(m, 0x60))
            mstore(0x20, validatedProofs_slot)
            mstore(m, sload(keccak256(0x00, 0x40)))
            return(m, 0x20)
        }
    }

    function setCommonReferenceString(bytes32[6] memory _commonReferenceString) public {
        require(msg.sender == owner, "only the owner can set the common reference string!");
        commonReferenceString = _commonReferenceString;
        emit LogSetCommonReferenceString(_commonReferenceString);
    }

    function setProof(uint16 _proofType, address _validatorAddress, bool _isBalanced) public {
        require(msg.sender == owner, "only the owner can set the proof type!");
        validators[_proofType] = _validatorAddress;
        if (_isBalanced) {
            balancedProofs[_proofType] = _isBalanced;
        }
        emit LogSetProof(_proofType, _validatorAddress, _isBalanced);
    }
}
