pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "../utils/IntegerUtils.sol";
import "../utils/NoteUtils.sol";
import "../utils/ProofUtils.sol";
import "../utils/SafeMaths.sol";

/**
 * @title The AZTEC Cryptography Engine
 * @author AZTEC
 * @dev ACE validates the AZTEC protocol's family of zero-knowledge proofs, which enables
 *      digital asset builders to construct fungible confidential digital assets according to the AZTEC token standard.
 **/
contract ACE {
    using IntegerUtils for uint256;
    using NoteUtils for bytes;
    using ProofUtils for uint24;
    using SafeMath8 for uint8;

    /* solhint-disable */
    event SetCommonReferenceString(bytes32[6] _commonReferenceString);
    event SetProof(
        uint8 indexed epoch, 
        uint8 indexed category, 
        uint8 indexed id, 
        address validatorAddress
    );
    event IncrementLatestEpoch(uint8 newLatestEpoch);

    struct Note {
        uint8 status;
        bytes5 createdOn;
        bytes5 destroyedOn;
        address owner;
    }
    struct Flags {
        bool canMint;
        bool canBurn;
        bool canConvert;
    }
    struct NoteRegistry {
        bool active;
        ERC20 linkedToken;
        uint256 scalingFactor;
        uint256 totalSupply;
        bytes32 confidentialTotalSupply;
        Flags flags;
        mapping(bytes32 => Note) notes;
        mapping(address => mapping(bytes32 => uint256)) publicApprovals;
    }
    /* solhint-enable */

    // The commonReferenceString contains one G1 group element and one G2 group element,
    // that are created via the AZTEC protocol's trusted setup. All zero-knowledge proofs supported
    // by ACE use the same common reference string.
    bytes32[6] private commonReferenceString;

    // TODO: add a consensus mechanism! This contract is for testing purposes only until then
    address public owner;

    mapping(bytes32 => bool) private validatedProofs;

    // Every user has their own note registry
    mapping(address => NoteRegistry) internal registries;

    // `validators`contains the addresses of the contracts that validate specific proof types
    mapping(uint8 => mapping(uint8 => mapping(uint8 => address))) public validators;

    // a list of invalidated proof ids, helpful to blacklist buggy old versions
    mapping(uint8 => mapping(uint8 => mapping(uint8 => bool))) internal disabledValidators;

    // latest proof epoch accepted by this contract
    uint8 public latestEpoch = 1;
    
    /**
    * @dev contract constructor. Sets the owner of ACE, the flags, the linked token address and
    *      the scaling factor.
    **/
    constructor() public {
        owner = msg.sender;
    }

    /**
    * @dev Validate an AZTEC zero-knowledge proof. ACE will issue a validation transaction to the smart contract
    *      linked to `_proof`. The validator smart contract will have the following interface:
    * ```
    *     function validate(
    *         bytes _proofData,
    *         address _sender,
    *         bytes32[6] _commonReferenceString
    *     ) public returns (bytes)
    * ```
    * @param _proof the AZTEC proof object
    * @param _sender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *   an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return a `bytes proofOutputs` variable formatted according to the Cryptography Engine standard
    */
    function validateProof(
        uint24 _proof,
        address _sender,
        bytes calldata
    ) external returns (bytes memory) {
        // validate that the provided _proof object maps to a corresponding validator and also that
        // the validator is not disabled
        address validatorAddress = extractValidatorAddress(_proof);
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
            mstore(0x00, _proof)
            // mstore(0x20, balancedProofs_slot)
            if sload(keccak256(0x00, 0x40)) { // index `balanceProofs[_proof]`
                // we must iterate over each `proofOutput` and record the proof hash
                let numProofOutputs := mload(add(proofOutputs, 0x20))
                for { let i := 0 } lt(i, numProofOutputs) { i := add(i, 0x01) } {
                    // get the location in memory of `proofOutput`
                    let loc := add(proofOutputs, mload(add(add(proofOutputs, 0x40), mul(i, 0x20))))
                    let proofHash := keccak256(loc, add(mload(loc), 0x20)) // hash the proof output
                    // combine the following: proofHash, _proof, msg.sender
                    // hashing the above creates a unique key that we can log against this proof, in `validatedProofs`
                    mstore(memPtr, proofHash)
                    mstore(add(memPtr, 0x20), _proof)
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
    * @param _proof the AZTEC proof object
    * Unnamed param is a dynamic array of proof hashes
    */
    function clearProofByHashes(uint24 _proof, bytes32[] calldata) external {
        assembly {
            let memPtr := mload(0x40)
            let proofHashes := add(0x04, calldataload(0x24))
            let length := calldataload(proofHashes)
            mstore(add(memPtr, 0x20), _proof)
            mstore(add(memPtr, 0x40), caller)
            mstore(0x20, validatedProofs_slot)
            for { let i := 0 } lt(i, length) { i := add(i, 0x01) } {
                let proofHash := calldataload(add(add(proofHashes, mul(i, 0x20)), 0x20))
                if iszero(proofHash) {
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
    * @dev Set the common reference string
    *      If the trusted setup is re-run, we will need to be able to change the crs
    * @param _commonReferenceString the new commonReferenceString
    */
    function setCommonReferenceString(bytes32[6] memory _commonReferenceString) public {
        require(msg.sender == owner, "only the owner can set the common reference string");
        commonReferenceString = _commonReferenceString;
        emit SetCommonReferenceString(_commonReferenceString);
    }

    /**
    * @dev Forever invalidate the given proof.
    * @param _proof the AZTEC proof object
    */
    function invalidateProof(uint24 _proof) public {
        require(msg.sender == owner, "only the owner can invalidate a proof");
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        disabledValidators[epoch][category][id] = true;
    }

    /**
    * @dev Validate a previously validated AZTEC proof via its hash
    *      This enables confidential assets to receive transfer instructions from a dApp that
    *      has already validated an AZTEC proof that satisfies a balancing relationship.
    * @param _proof the AZTEC proof object
    * @param _proofHash the hash of the `proofOutput` received by the asset
    * @param _sender the Ethereum address of the contract issuing the transfer instruction
    * @return a boolean that signifies whether the corresponding AZTEC proof has been validated
    */
    function validateProofByHash(
        uint24 _proof,
        bytes32 _proofHash,
        address _sender
    ) public view returns (bool) {
        assembly {
            let memPtr := mload(0x40)
            mstore(memPtr, _proofHash)
            mstore(add(memPtr, 0x20), _proof)
            mstore(add(memPtr, 0x40), _sender)
            mstore(0x00, keccak256(memPtr, 0x60))
            mstore(0x20, validatedProofs_slot)
            mstore(memPtr, sload(keccak256(0x00, 0x40)))
            return(memPtr, 0x20)
        }
    }

    /**
    * @dev Adds or modifies a proof into the Cryptography Engine.
    *       This method links a given `_proof` to a smart contract validator.
    * @param _proof the AZTEC proof object
    * @param _validatorAddress the address of the smart contract validator
    */
    function setProof(
        uint24 _proof,
        address _validatorAddress
    ) public {
        require(msg.sender == owner, "only the owner can set a proof");
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        require(epoch <= latestEpoch, "the proof epoch cannot be bigger than the latest epoch");
        require(validators[epoch][category][id] == address(0x0), "existing proofs cannot be modified");
        validators[epoch][category][id] = _validatorAddress;
        emit SetProof(epoch, category, id, _validatorAddress);
    }

    /**
     * @dev Increments the latestEpoch storage variable.
     */
    function incrementLatestEpoch() public {
        require(msg.sender == owner, "only the owner can update the latest epoch");
        latestEpoch = latestEpoch.add(1);
        emit IncrementLatestEpoch(latestEpoch);
    }

    function createNoteRegistry(
        address _linkedToken,
        uint256 _scalingFactor,
        bool _canMint,
        bool _canBurn,
        bool _canConvert
    ) public {
        require(registries[msg.sender].active == false, "address already has a linked note registry");
        NoteRegistry memory registry = NoteRegistry({
            active: true,
            scalingFactor: _scalingFactor,
            linkedToken: ERC20(_linkedToken),
            totalSupply: 0,
            confidentialTotalSupply: bytes32(0x0),
            flags: Flags({
                canMint: _canMint,
                canBurn: _canBurn,
                canConvert: _canConvert
            })
        });
        registries[msg.sender] = registry;
    }

    function updateNoteRegistry(
        bytes memory _proofOutput, 
        uint24 _proof, 
        address _proofSender
    ) public returns (bool) {
        NoteRegistry storage registry = registries[msg.sender];
        require(registry.active == true, "note registry does not exist for the given address");
        bytes32 proofHash = _proofOutput.hashProofOutput();
        require(
            validateProofByHash(_proof, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof"
        );

        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);


        if (publicValue != 0) {
            require(registry.flags.canMint == false, "mintable assets cannot be converted into public tokens");
            require(registry.flags.canBurn == false, "burnable assets cannot be converted into public tokens");
            require(registry.flags.canConvert == true, "this asset cannot be converted into public tokens");
            if (publicValue < 0) {
                registry.totalSupply += uint256(-publicValue);
                require(
                    registry.publicApprovals[publicOwner][proofHash] >= uint256(-publicValue),
                    "public owner has not validated a transfer of tokens"
                );
                registry.publicApprovals[publicOwner][proofHash] -= uint256(-publicValue);
                require(
                    registry.linkedToken.transferFrom(
                        publicOwner, 
                        address(this), 
                        uint256(-publicValue)
                    ), 
                    "transfer failed"
                );
            } else {
                registry.totalSupply -= uint256(publicValue);
                require(registry.linkedToken.transfer(publicOwner, uint256(publicValue)), "transfer failed");
            }
        }

        return true;
    }

    function mint(bytes memory _proofOutput, address _proofSender) public returns (bool) {
        NoteRegistry storage registry = registries[msg.sender];
        require(registry.active == false, "note registry does not exist for the given address");
        require(registry.flags.canMint == true, "this asset is not mintable");
        bytes32 proofHash = _proofOutput.hashProofOutput();
        require(
            validateProofByHash(1, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof"
        );
        (
            bytes memory inputNotes,
            bytes memory outputNotes,
            ,
            int256 publicValue
        ) = _proofOutput.extractProofOutput();
        require(publicValue == 0, "mint transactions cannot have a public value");

        require(outputNotes.getLength() > 0, "mint transactions require at least one output note");
        require(inputNotes.getLength() == 1, "mint transactions can only have one input note");
        (
            ,
            bytes32 noteHash,
        ) = outputNotes.get(0).extractNote();
        require(noteHash == registry.confidentialTotalSupply, "provided total supply note does not match");
        (
            ,
            noteHash,
        ) = inputNotes.get(0).extractNote();

        registry.confidentialTotalSupply = noteHash;

        for (uint i = 1; i < outputNotes.getLength(); i += 1) {
            address _owner;
            (_owner, noteHash, ) = outputNotes.get(i).extractNote();
            Note storage note = registry.notes[noteHash];
            require(note.status == 0, "output note exists");
            note.status = uint8(1);
            // AZTEC uses timestamps to measure the age of a note on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.createdOn = now.uintToBytes(5);
            note.owner = _owner;
        }
    }

    function burn(bytes memory _proofOutput, address _proofSender) public returns (bool) {
        NoteRegistry storage registry = registries[msg.sender];
        require(registry.active == true, "note registry does not exist for the given address");
        require(registry.flags.canBurn == true, "this asset is not burnable");
        bytes32 proofHash = _proofOutput.hashProofOutput();
        require(
            validateProofByHash(1, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof"
        );
        (
            bytes memory inputNotes,
            bytes memory outputNotes,
            ,
            int256 publicValue
        ) = _proofOutput.extractProofOutput();
        require(publicValue == 0, "mint transactions cannot have a public value");

        require(inputNotes.getLength() > 0, "burn transactions require at least one input note");
        require(outputNotes.getLength() == 1, "burn transactions can only have one output note");
        (
            ,
            bytes32 noteHash,
        ) = inputNotes.get(0).extractNote();
        require(noteHash == registry.confidentialTotalSupply, "provided total supply note does not match");
        (
            ,
            noteHash,
        ) = outputNotes.get(0).extractNote();

        registry.confidentialTotalSupply = noteHash;

        for (uint i = 1; i < inputNotes.getLength(); i += 1) {
            address _owner;
            (_owner, noteHash, ) = outputNotes.get(i).extractNote();
            Note storage note = registry.notes[noteHash];
            require(note.status == 1, "input note does not exist");
            require(note.owner == _owner, "input note owner does not match");
            note.status = uint8(2);
            // AZTEC uses timestamps to measure the age of a note, on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.destroyedOn = now.uintToBytes(5);
        }
    }

    function publicApprove(bytes32 proofHash, uint256 value) public returns (bool) {
        NoteRegistry storage registry = registries[msg.sender];
        registry.publicApprovals[msg.sender][proofHash] = value;
        return true;
    }

    /**
    * @dev Returns the validator address for a given proof object
    */
    function getValidatorAddress(uint24 _proof) public view returns (address) {
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        return validators[epoch][category][id];
    }

    /**
     * @dev Returns the registry for a given address
     */
    function getRegistry(address _owner) public view returns (
        ERC20 _linkedToken,
        uint256 _scalingFactor,
        uint256 _totalSupply,
        bytes32 _confidentialTotalSupply,
        bool _canMint,
        bool _canBurn,
        bool _canConvert
    ) {
        NoteRegistry memory registry = registries[_owner];
        return (
            registry.linkedToken,
            registry.scalingFactor,
            registry.totalSupply,
            registry.confidentialTotalSupply,
            registry.flags.canMint,
            registry.flags.canBurn,
            registry.flags.canConvert
        );
    }

    /**
     * @dev Returns the note for a given address and note hash
     */
    function getNote(address _owner, bytes32 _noteHash) public view returns (
        uint8 _status,
        bytes5 _createdOn,
        bytes5 _destroyedOn,
        address _noteOwner
    ) {
        NoteRegistry storage registry = registries[_owner];
        Note storage note = registry.notes[_noteHash];
        return (
            note.status,
            note.createdOn,
            note.destroyedOn,
            note.owner
        );
    }
    
    /**
    * @dev Returns the common reference string.
    * We use a custom getter for `commonReferenceString` - the default getter created by making the storage
    * variable public indexes individual elements of the array, and we want to return the whole array
    */
    function getCommonReferenceString() public view returns (bytes32[6] memory) {
        return commonReferenceString;
    }

    function extractValidatorAddress(uint24 _proof) internal view returns (address) {
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        require(validators[epoch][category][id] != address(0x0), "expected the validator address to exist");
        require(disabledValidators[epoch][category][id] == false, "expected the validator address to not be disabled");
        return validators[epoch][category][id];
    }

    function updateInputNotes(bytes memory inputNotes) internal {
        for (uint i = 0; i < inputNotes.getLength(); i += 1) {
            (address _owner, bytes32 noteHash,) = inputNotes.get(i).extractNote();
            // `note` will be stored on the blockchain
            Note storage note = registries[msg.sender].notes[noteHash];
            require(note.status == 1, "input note does not exist");
            require(note.owner == _owner, "input note owner does not match");
            note.status = uint8(2);
            // AZTEC uses timestamps to measure the age of a note, on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.destroyedOn = now.uintToBytes(5);
        }
    }

    function updateOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i += 1) {
            (address _owner, bytes32 noteHash,) = outputNotes.get(i).extractNote();
            // `note` will be stored on the blockchain
            Note storage note = registries[msg.sender].notes[noteHash];
            require(note.status == 0, "output note exists");
            note.status = uint8(1);
            // AZTEC uses timestamps to measure the age of a note on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.createdOn = now.uintToBytes(5);
            note.owner = _owner;
        }
    }
}

