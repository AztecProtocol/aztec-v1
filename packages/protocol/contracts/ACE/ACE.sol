pragma solidity >=0.5.0 <0.6.0;

import "./NoteRegistry.sol";
import "../utils/NoteUtils.sol";

/**
 * @title The AZTEC Cryptography Engine
 * @author AZTEC
 * @dev ACE validates the AZTEC protocol's family of zero-knowledge proofs, which enables
 * digital asset builders to construct fungible confidential digital assets according to the AZTEC token standard.
 **/
contract ACE {
    // the commonReferenceString contains one G1 group element and one G2 group element,
    // that are created via the AZTEC protocol's trusted setup. All zero-knowledge proofs supported
    // by ACE use the same common reference string.
    bytes32[6] private commonReferenceString;

    // TODO: add a consensus mechanism! This contract is for testing purposes only until then
    address public owner;

    // `validators` contains the validator smart contracts that validate specific proof types
    mapping(uint16 => address) public validators;

    // `balancedProofs` identifies whether a proof type satisfies a balancing relationship.
    // Proofs are split into two categories - those that prove a balancing relationship and those that don't
    //      The latter are 'utility' proofs that can be used by developers to add some requirements on top of
    //      a proof that satisfies a balancing relationship.
    //      e.g. for a given asset, one might want to only process a join-split transaction if the transaction
    //      sender can prove that the new note owners do not own > 50% of the total supply of an asset.
    //
    //      For the former category, ACE will record that a given proof has satisfied a balancing relationship in
    //      `validatedProofs`. This proof can then be queried by confidential assets without having to re-validate
    //      the proof.
    //      For example, in a bilateral swap proof - a balancing relationship is satisfied for two confidential assets.
    //      If a DApp validates this proof, it can then send transfer instructions
    //          to the relevant confidential digital assets.
    //      These assets can directly query ACE, which will attest to the cryptographic legitimacy of the
    //          transfer instruction without having to validate another zero-knowledge proof.
    mapping(uint16 => bool) public balancedProofs;
    mapping(bytes32 => bool) private validatedProofs;

    mapping(address => NoteRegistry) public noteRegistries;

    event LogSetProof(uint16 _proofType, address _validatorAddress, bool _isBalanced);
    event LogSetCommonReferenceString(bytes32[6] _commonReferenceString);

    /**
    * @dev contract constructor. Sets the owner of ACE.
    **/
    constructor() public {
        owner = msg.sender;
    }

    /**
    * @dev Validate an AZTEC zero-knowledge proof. ACE will issue a validation transaction to the smart contract
    *       linked to `_proofType`. The validator smart contract will have the following interface:
    *       ```
    *           function validate(
    *               bytes _proofData,
    *               address _sender,
    *               bytes32[6] _commonReferenceString
    *           ) public returns (bytes)
    *       ```
    * @param _proofType the AZTEC proof type
    * @param _sender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *   an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return a `bytes proofOutputs` variable formatted according to the Cryptography Engine standard
    */
    function validateProof(
        uint16 _proofType,
        address _sender,
        bytes calldata
    ) external returns (
        bytes memory
    ) {
        // validate that the provided _proofType maps to a corresponding validator
        address validatorAddress = validators[_proofType];
        require(validatorAddress != address(0), "expect validator address to exist");
        assembly {
            let memPtr := mload(0x40)
            let _proofData := add(0x04, calldataload(0x44)) // calldata location of start of `proofData`

            // manually construct validator calldata map
            mstore(add(memPtr, 0x04), 0x100) // location in calldata of the start of `bytes _proofData` (0x100)
            mstore(add(memPtr, 0x24), _sender)
            mstore(add(memPtr, 0x44), sload(commonReferenceString_slot))
            mstore(add(memPtr, 0x64), sload(add(0x01, commonReferenceString_slot)))
            mstore(add(memPtr, 0x84), sload(add(0x02, commonReferenceString_slot)))
            mstore(add(memPtr, 0xa4), sload(add(0x03, commonReferenceString_slot)))
            mstore(add(memPtr, 0xc4), sload(add(0x04, commonReferenceString_slot)))
            mstore(add(memPtr, 0xe4), sload(add(0x05, commonReferenceString_slot)))
            calldatacopy(add(memPtr, 0x104), _proofData, add(calldataload(_proofData), 0x20))

            // call our validator smart contract, and validate the call succeeded
            
            if iszero(staticcall(gas, validatorAddress, memPtr, add(calldataload(_proofData), 0x124), 0x00, 0x00)) {
                mstore(0x00, 400) revert(0x00, 0x20) // call failed - proof is invalid!
            }
            returndatacopy(memPtr, 0x00, returndatasize) // copy returndata to memory
            let returnStart := memPtr
            let proofOutputs := add(memPtr, mload(memPtr)) // proofOutputs points to the start of return data
            memPtr := add(add(memPtr, 0x20), returndatasize)
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
                    mstore(memPtr, proofHash)
                    mstore(add(memPtr, 0x20), _proofType)
                    mstore(add(memPtr, 0x40), caller)
                    mstore(0x00, keccak256(memPtr, 0x60)) mstore(0x20, validatedProofs_slot)
                    sstore(keccak256(0x00, 0x40), 0x01)
                }
            }
            return(returnStart, returndatasize) // return `proofOutputs` to caller
        }
    }

    /**
    * @dev Clear storage variables set when validating zero-knowledge proofs.
    *      The only address that can clear data from `validatedProofs` is the address that created the proof.
    *      Function is designed to utilize [EIP-1283](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1283.md)
    *      to reduce gas costs. It is highly likely that any storage variables set by `validateProof`
    *      are only required for the duration of a single transaction.
    *      E.g. a decentralized exchange validating a swap proof and sending transfer instructions to
    *      two confidential assets.
    *      This method allows the calling smart contract to recover most of the gas spent by setting `validatedProofs`
    * @param _proofType the AZTEC proof type
    * Unnamed param is a dynamic array of proof hashes
    */
    function clearProofByHashes(uint16 _proofType, bytes32[] calldata) external {
        assembly {
            let memPtr := mload(0x40)
            let proofHashes := add(0x04, calldataload(0x24))
            let length := calldataload(proofHashes)
            mstore(add(memPtr, 0x20), _proofType)
            mstore(add(memPtr, 0x40), caller)
            mstore(0x20, validatedProofs_slot)
            for { let i := 0 } lt(i, length) { i := add(i, 0x01) } {
                let proofHash := calldataload(add(add(proofHashes, mul(i, 0x20)), 0x20))
                switch iszero(proofHash)
                case 1 {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }
                mstore(memPtr, proofHash)
                mstore(0x00, keccak256(memPtr, 0x60))
                sstore(keccak256(0x00, 0x40), 0x00)
            }
        }
    }

    /**
    * @dev Validate a previously validated AZTEC proof via its hash
    *      This enables confidential assets to receive transfer instructions from a Dapp that
    *      has already validated an AZTEC proof that satisfies a balancing relationship.
    * @param _proofType the AZTEC proof type
    * @param _proofHash the hash of the `proofOutput` received by the asset
    * @param _sender the Ethereum address of the contract issuing the transfer instruction
    * @return a boolean that signifies whether the corresponding AZTEC proof has been validated
    */
    function validateProofByHash(
        uint16 _proofType,
        bytes32 _proofHash,
        address _sender
    ) external view returns (bool) {
        assembly {
            let memPtr := mload(0x40)
            mstore(memPtr, _proofHash)
            mstore(add(memPtr, 0x20), _proofType)
            mstore(add(memPtr, 0x40), _sender)
            mstore(0x00, keccak256(memPtr, 0x60))
            mstore(0x20, validatedProofs_slot)
            mstore(memPtr, sload(keccak256(0x00, 0x40)))
            return(memPtr, 0x20)
        }
    }

    function createNoteRegistry(
        bool _canMint,
        bool _canBurn,
        bool _canConvert,
        uint256 _scalingFactor,
        address _linkedToken
    ) public returns (address) {
        require(noteRegistries[msg.sender] == NoteRegistry(0), "address already has a linked Note Registry");
        NoteRegistry registry = new NoteRegistry(
            _canMint,
            _canBurn,
            _canConvert,
            _scalingFactor,
            _linkedToken,
            address(this),
            address(this)
        );
        noteRegistries[msg.sender] = registry;
        return address(registry);
    }

    function updateNoteRegistry(
        bytes memory _proofOutput, 
        uint16 _proofType, 
        address _proofSender
    ) public returns (bool) {
        NoteRegistry registry = noteRegistries[msg.sender];
        require(registry != NoteRegistry(0), "sender does not have a linked Note Registry");
        require(registry.updateNoteRegistry(_proofOutput, _proofType, _proofSender), "update failed!");
        return true;
    }

    /**
    * @dev Set the common reference string
    *      If the trusted setup is re-run, we will need to be able to change the crs
    * @param _commonReferenceString the new commonReferenceString
    */
    function setCommonReferenceString(bytes32[6] memory _commonReferenceString) public {
        require(msg.sender == owner, "only the owner can set the common reference string!");
        commonReferenceString = _commonReferenceString;
        emit LogSetCommonReferenceString(_commonReferenceString);
    }

    /**
    * @dev Adds or modifies a proofType into the Cryptography Engine.
    *      This method links a given `_proofType` to a smart contract validator.
    * @param _proofType the AZTEC proof type
    * @param _validatorAddress the address of the smart contract validator
    * @param _isBalanced does this proof satisfy a balancing relationship?
    */
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
    
    /**
    * @dev Returns the validator address for a given proof type
    */
    function getValidatorAddress(uint16 _proofType) public view returns (address) {
        return validators[_proofType];
    }
    
    /**
    * @dev Returns the validator address for a given proof type
    */
    function getIsProofBalanced(uint16 _proofType) public view returns (bool) {
        return balancedProofs[_proofType];
    }

    /**
    * @dev Returns the common reference string.
    * we use a custom getter for `commonReferenceString` - the default getter created by making the storage
    * variable public indexes individual elements of the array, and we want to return the whole array
    */
    function getCommonReferenceString() public view returns (bytes32[6] memory) {
        return commonReferenceString;
    }
}
