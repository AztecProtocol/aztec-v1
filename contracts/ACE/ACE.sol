pragma solidity 0.4.24;


library NoteUtilities {

    function length(bytes memory proofOutputsOrNotes) internal pure returns (
        uint len
    ) {
        assembly {
                len := mload(add(proofOutputsOrNotes, 0x20))
        }
    }

    function get(bytes memory proofOutputsOrNotes, uint i) internal pure returns (
        bytes out
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
    bytes32[6] private commonReferenceString;
    address public owner;
    mapping(uint16 => address) public validators;
    mapping(uint16 => bool) public balancedProofs;
    mapping(bytes32 => bool) private validatedProofs;

    event LogSetProof(uint16 _proofType, address _validatorAddress, bool _isBalanced);
    event LogSetCommonReferenceString(bytes32[6] _commonReferenceString);

    constructor() public {
        owner = msg.sender;
    }

    // create our calldata map. The validator smart contract must have the following interface:
    /*
        *  function validate(
        *      bytes _proofData,
        *      address _sender,
        *      bytes32[6] _commonReferenceString
        *  ) public returns (bytes)
    */
    function validateProof(
        uint16 _proofType,
        address _sender,
        bytes
    ) external returns (
        bytes memory
    ) {
        // validate that the provided _proofType maps to a corresponding validator
        address validatorAddress = validators[_proofType];
        require(validatorAddress != address(0), "expect validator address to exist");
        assembly {
            let m := mload(0x40)
            let _proofData := add(0x04, calldataload(0x44)) // calldata location of start of `proofData`

            // manually construct validator calldata map
            mstore(add(m, 0x04), 0x100) // location in calldata of the start of `bytes _proofData` (0x100)
            mstore(add(m, 0x24), _sender)
            mstore(add(m, 0x44), sload(commonReferenceString_slot))
            mstore(add(m, 0x64), sload(add(0x01, commonReferenceString_slot)))
            mstore(add(m, 0x84), sload(add(0x02, commonReferenceString_slot)))
            mstore(add(m, 0xa4), sload(add(0x03, commonReferenceString_slot)))
            mstore(add(m, 0xc4), sload(add(0x04, commonReferenceString_slot)))
            mstore(add(m, 0xe4), sload(add(0x05, commonReferenceString_slot)))
            calldatacopy(add(m, 0x104), _proofData, add(calldataload(_proofData), 0x20))

            // call our validator smart contract, and validate the call succeeded
            if iszero(staticcall(gas, validatorAddress, m, add(calldataload(_proofData), 0x124), 0x00, 0x00)) {
                mstore(0x00, 400) revert(0x00, 0x20) // call failed - proof is invalid!
            }
            returndatacopy(m, 0x00, returndatasize) // copy returndata to memory
            let proofOutputs := add(m, mload(m)) // proofOutputs points to the start of return data
            m := add(add(m, 0x20), returndatasize)
            // does this proof satisfy a balancing relationship? If it does, we need to record the proof
            mstore(0x00, _proofType) mstore(0x20, balancedProofs_slot)
            switch sload(keccak256(0x00, 0x40)) // index `balanceProofs[_profType]`
            case 1 {
                // we must iterate over each `proofOutput` and record the proof hash
                let numProofOutputs := mload(add(proofOutputs, 0x20))
                for { let i := 0 } lt(i, numProofOutputs) { i := add(i, 0x01) } {
                    // get the location in memory of `proofOutput`
                    let loc := add(proofOutputs, mload(add(add(proofOutputs, 0x40), mul(i, 0x20))))
                    let proofHash := keccak256(loc, add(mload(loc), 0x20)) // hash the proof output
                    // combine the following: proofHash, _proofType, msg.sender
                    // hashing the above creates a unique key that we can log against this proof, in `validatedProofs`
                    mstore(m, proofHash)
                    mstore(add(m, 0x20), _proofType)
                    mstore(add(m, 0x40), caller)
                    mstore(0x00, keccak256(m, 0x60)) mstore(0x20, validatedProofs_slot)
                    sstore(keccak256(0x00, 0x40), 0x01)
                }
            }
            return(proofOutputs, returndatasize) // return `proofOutputs` to caller
        }
    }

    function clearProofByHashes(uint16 _proofType, bytes32[]) external {
        assembly {
            let m := mload(0x40)
            let proofHashes := add(0x04, calldataload(0x24))
            let length := calldataload(proofHashes)
            mstore(add(m, 0x20), _proofType)
            mstore(add(m, 0x40), caller)
            mstore(0x20, validatedProofs_slot)
            for { let i := 0 } lt(i, length) { i := add(i, 0x01) } {
                let proofHash := calldataload(add(add(proofHashes, mul(i, 0x20)), 0x20))
                switch iszero(proofHash)
                case 1 {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }
                mstore(m, proofHash)
                mstore(0x00, keccak256(m, 0x60))
                sstore(keccak256(0x00, 0x40), 0x00)
            }
        }
    }

    function validateProofByHash(
        uint16 _proofType,
        bytes32 _proofHash,
        address _sender
    ) external view returns (bool) {
        assembly {
            let m := mload(0x40)
            mstore(m, _proofHash)
            mstore(add(m, 0x20), _proofType)
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

    function setProof(
        uint16 _proofType,
        address _validatorAddress,
        bool _isBalanced
    ) public {
        require(msg.sender == owner, "only the owner can set the proof type!");
        validators[_proofType] = _validatorAddress;
        balancedProofs[_proofType] = _isBalanced;
        emit LogSetProof(_proofType, _validatorAddress, _isBalanced);
    }
    
    // we use a custom getter for `commonReferenceString` - the default getter created by making this
    // variable public indexes individual elements of the array and we want to return the whole array
    function getCommonReferenceString() public view returns (bytes32[6]) {
        return commonReferenceString;
    }
}
