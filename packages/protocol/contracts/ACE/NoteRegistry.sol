pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../interfaces/IAZTEC.sol";
import "../libs/NoteUtils.sol";
import "../libs/ProofUtils.sol";

/**
 * @title NoteRegistry contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev The NoteRegistry defines the state of valid AZTEC notes. It enacts instructions to update the 
 * state, given to it by the ACE and only the note registry owner can enact a state update.  
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract NoteRegistry is IAZTEC {
    using NoteUtils for bytes;
    using SafeMath for uint256;
    using ProofUtils for uint24;

    /**
    * Note struct. This is the data that we store when we log AZTEC notes inside a NoteRegistry
    *
    * Data structured so that the entire struct fits in 1 storage word.
    *
    * @notice Yul is used to pack and unpack Note structs in storage for efficiency reasons,
    *   see `NoteRegistry.updateInputNotes` and `NoteRegistry.updateOutputNotes` for more details
    **/
    struct Note {
        // `status` uses the IAZTEC.NoteStatus enum to track the lifecycle of a note.
        uint8 status;

        // `createdOn` logs the timestamp of the block that created this note. There are a few
        // use cases that require measuring the age of a note, (e.g. interest rate computations).
        // These lifetime are relevant on timescales of days/months, the 900-ish seconds that a miner
        // can manipulate a timestamp has little effect, but should be considered when utilizing this parameter.
        // We store `createdOn` in 5 bytes of data - just in case this contract is still around in 2038 :)
        // This kicks the 'year 2038' problem down the road by about 400 years
        uint40 createdOn;

        // `destroyedOn` logs the timestamp of the block that destroys this note in a transaction.
        // Default value is 0x0000000000 for notes that have not been spent.
        uint40 destroyedOn;

        // The owner of the note
        address owner;
    }

    struct Flags {
        bool active;
        bool canAdjustSupply;
        bool canConvert;
    }

    struct Registry {
        IERC20 linkedToken;
        uint256 scalingFactor;
        uint256 totalSupply;
        bytes32 confidentialTotalMinted;
        bytes32 confidentialTotalBurned;
        uint256 supplementTotal;
        Flags flags;
        mapping(bytes32 => Note) notes;
        mapping(address => mapping(bytes32 => uint256)) publicApprovals;
    }

    // Every user has their own note registry
    mapping(address => Registry) internal registries;

    mapping(bytes32 => bool) public validatedProofs;

    /**
    * @dev Call transferFrom on a linked ERC20 token. Used in cases where the ACE's mint
    * function is called but the token balance of the note registry in question is
    * insufficient
    *
    * @param _value the value to be transferred
    */
    function supplementTokens(uint256 _value) external {
        Registry storage registry = registries[msg.sender];
        require(registry.flags.active == true, "note registry does not exist for the given address");
        require(registry.flags.canConvert == true, "note registry does not have conversion rights");
        
        // Only scenario where supplementTokens() should be called is when a mint/burn operation has been executed
        require(registry.flags.canAdjustSupply == true, "note registry does not have mint and burn rights");
        
        registry.linkedToken.transferFrom(msg.sender, address(this), _value.mul(registry.scalingFactor));

        registry.totalSupply = registry.totalSupply.add(_value);
    }

    /**
    * @dev Query the ACE for a previously validated proof
    * @notice This is a virtual function, that must be overwritten by the contract that inherits from NoteRegistr
    *
    * @param _proof - unique identifier for the proof in question and being validated
    * @param _proofHash - keccak256 hash of a bytes proofOutput argument. Used to identify the proof in question
    * @param _sender - address of the entity that originally validated the proof
    * @return boolean - true if the proof has previously been validated, false if not
    */
    function validateProofByHash(uint24 _proof, bytes32 _proofHash, address _sender) public view returns (bool);

    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public {
        require(registries[msg.sender].flags.active == false, "address already has a linked note registry");
        if (_canConvert) {
            require(_linkedTokenAddress != address(0x0), "expected the linked token address to exist");
        }
        Registry memory registry = Registry({
            linkedToken: IERC20(_linkedTokenAddress),
            scalingFactor: _scalingFactor,
            totalSupply: 0,
            confidentialTotalMinted: ZERO_VALUE_NOTE_HASH,
            confidentialTotalBurned: ZERO_VALUE_NOTE_HASH,
            supplementTotal: 0,
            flags: Flags({
                active: true,
                canAdjustSupply: _canAdjustSupply,
                canConvert: _canConvert
            })
        });
        registries[msg.sender] = registry;
    }

    /**
    * @dev Update the state of the note registry according to transfer instructions issued by a 
    * zero-knowledge proof
    *
    * @param _proof - unique identifier for a proof
    * @param _proofOutput - transfer instructions issued by a zero-knowledge proof
    * @param _proofSender - address of the entity sending the proof
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput,
        address _proofSender
    ) public {
        Registry storage registry = registries[msg.sender];
        Flags memory flags = registry.flags;
        require(flags.active == true, "note registry does not exist for the given address");
        bytes32 proofHash = keccak256(_proofOutput);
        require(
            validateProofByHash(_proof, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof"
        );
        
        // clear record of valid proof - stops re-entrancy attacks and saves some gas
        validatedProofs[proofHash] = false;
        
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);

        // If publicValue != 0, enact a token transfer
        // (publicValue < 0) => transfer from publicOwner to ACE
        // (publicValue > 0) => transfer from ACE to publicOwner
        if (publicValue != 0) {
            require(flags.canConvert == true, "asset cannot be converted into public tokens");

            if (publicValue < 0) {
                uint256 publicApprovals = registry.publicApprovals[publicOwner][proofHash];
                registry.totalSupply = registry.totalSupply.add(uint256(-publicValue));
                require(
                    publicApprovals >= uint256(-publicValue),
                    "public owner has not validated a transfer of tokens"
                );
                // TODO: redundant step
                registry.publicApprovals[publicOwner][proofHash] = publicApprovals.sub(uint256(-publicValue));
                registry.linkedToken.transferFrom(
                    publicOwner,
                    address(this),
                    uint256(-publicValue).mul(registry.scalingFactor));
            } else {
                registry.totalSupply = registry.totalSupply.sub(uint256(publicValue));
                registry.linkedToken.transfer(publicOwner, uint256(publicValue).mul(registry.scalingFactor));
            }
        }
    }

    /** 
    * @dev This should be called from an asset contract.
    */
    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) public {
        Registry storage registry = registries[_registryOwner];
        require(registry.flags.active == true, "note registry does not exist");
        registry.publicApprovals[msg.sender][_proofHash] = _value;
    }

    /**
     * @dev Returns the registry for a given address.
     *
     * @param _owner - address of the registry owner in question
     * @return linkedTokenAddress - public ERC20 token that is linked to the NoteRegistry. This is used to
     * transfer public value into and out of the system     
     * @return scalingFactor - defines how many ERC20 tokens are represented by one AZTEC note
     * @return totalSupply - TODO
     * @return confidentialTotalMinted - keccak256 hash of the note representing the total minted supply
     * @return confidentialTotalBurned - keccak256 hash of the note representing the total burned supply
     * @return canConvert - flag set by the owner to decide whether the registry has public to private, and 
     * vice versa, conversion privilege
     * @return canAdjustSupply - determines whether the registry has minting and burning privileges 
     */
    function getRegistry(address _owner) public view returns (
        address linkedToken,
        uint256 scalingFactor,
        uint256 totalSupply,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        bool canConvert,
        bool canAdjustSupply
    ) {
        require(registries[_owner].flags.active == true, "expected registry to be created");
        Registry memory registry = registries[_owner];
        return (
            address(registry.linkedToken),
            registry.scalingFactor,
            registry.totalSupply,
            registry.confidentialTotalMinted,
            registry.confidentialTotalBurned,
            registry.flags.canConvert,
            registry.flags.canAdjustSupply
        );
    }

    /**
     * @dev Returns the note for a given address and note hash.
     *
     * @param _registryOwner - address of the registry owner
     * @param _noteHash - keccak256 hash of the note coordiantes (gamma and sigma)
     * @return status - status of the note, details whether the note is in a note registry
     * or has been destroyed
     * @return createdOn - time the note was created
     * @return destroyedOn - time the note was destroyed
     * @return noteOwner - address of the note owner
     */
    function getNote(address _registryOwner, bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    ) {
        require(
            registries[_registryOwner].notes[_noteHash].status != uint8(NoteStatus.DOES_NOT_EXIST), 
            "expected note to exist"
        );
        // Load out a note for a given registry owner. Struct unpacking is done in Yul to improve efficiency
        // solhint-disable-next-line no-unused-vars
        Note storage notePtr = registries[_registryOwner].notes[_noteHash];
        assembly {
            let note := sload(notePtr_slot)
            status := and(note, 0xff)
            createdOn := and(shr(8, note), 0xffffffffff)
            destroyedOn := and(shr(48, note), 0xffffffffff)
            noteOwner := and(shr(88, note), 0xffffffffffffffffffffffffffffffffffffffff)
        }
    }

    /**
     * @dev Removes input notes from the note registry
     *
     * @param inputNotes - an array of input notes from a zero-knowledge proof, that are to be
     * removed and destroyed from a note registry
     */
    function updateInputNotes(bytes memory inputNotes) internal {
        // set up some temporary variables we'll need
        // N.B. the status flags are NoteStatus enums, but written as uint8's.
        // We represent them as uint256 vars because it is the enum values that enforce type safety.
        // i.e. if we include enums that range beyond 256,
        // casting to uint8 won't help because we'll still be writing/reading the wrong note status
        // To summarise the summary - validate enum bounds in tests, use uint256 to save some gas vs uint8
        uint256 inputNoteStatusNew = uint256(NoteStatus.SPENT);
        uint256 inputNoteStatusOld;
        address inputNoteOwner;

        // Update the status of each `note` `inputNotes` to the following:
        // 1. set the note status to SPENT
        // 2. update the `destroyedOn` timestamp to the current timestamp
        // We also must check the following:
        // 1. the note has an existing status of UNSPENT
        // 2. the note owner matches the provided input
        uint256 length = inputNotes.getLength();
        for (uint256 i = 0; i < length; i += 1) {
            (address noteOwner, bytes32 noteHash,) = inputNotes.get(i).extractNote();

            // Get the storage location of the input note
            // solhint-disable-next-line no-unused-vars
            Note storage inputNotePtr = registries[msg.sender].notes[noteHash];

            // We update the note using Yul, as Solidity can be a bit inefficient when performing struct packing.
            // The compiler also invokes redundant sload opcodes that we can remove in Yul
            assembly {
                // load up our note from storage
                let note := sload(inputNotePtr_slot)

                // extract the status of this note (we'll check that it is UNSPENT outside the asm block)
                inputNoteStatusOld := and(note, 0xff)

                // extract the owner of this note (we'll check that it is _owner outside the asm block)
                inputNoteOwner := and(shr(88, note), 0xffffffffffffffffffffffffffffffffffffffff)

                // update the input note and write it into storage.
                // We need to change its `status` from UNSPENT to SPENT, and update `destroyedOn`
                sstore(
                    inputNotePtr_slot,
                    or(
                        // zero out the bits used to store `status` and `destroyedOn`
                        // `status` occupies byte index 1, `destroyedOn` occupies byte indices 6 - 11.
                        // We create bit mask with a NOT opcode to reduce contract bytecode size.
                        // We then perform logical AND with the bit mask to zero out relevant bits
                        and(
                            note,
                            not(0xffffffffff0000000000ff)
                        ),
                        // Now that we have zeroed out storage locations of `status` and `destroyedOn`, update them
                        or(
                            // Create 5-byte timestamp and shift into byte positions 6-11 with a bit shift
                            shl(48, and(timestamp, 0xffffffffff)),
                            // Combine with the new note status (masked to a uint8)
                            and(inputNoteStatusNew, 0xff)
                        )
                    )
                )
            }
            // Check that the note status is UNSPENT
            require(inputNoteStatusOld == uint256(NoteStatus.UNSPENT), "input note status is not UNSPENT");
            // Check that the note owner is the expected owner
            require(inputNoteOwner == noteOwner, "input note owner does not match");
        }
    }

    /**
     * @dev Adds output notes to the note registry
     *
     * @param outputNotes - an array of output notes from a zero-knowledge proof, that are to be
     * added to the note registry
     */
    function updateOutputNotes(bytes memory outputNotes) internal {
        // set up some temporary variables we'll need
        uint256 outputNoteStatusNew = uint256(NoteStatus.UNSPENT);
        uint256 outputNoteStatusOld;
        uint256 length = outputNotes.getLength();

        for (uint256 i = 0; i < length; i += 1) {
            (address noteOwner, bytes32 noteHash,) = outputNotes.get(i).extractNote();
            require(noteOwner != address(0x0), "output note owner cannot be address(0x0)");

            // Create a record in the note registry for this output note
            // solhint-disable-next-line no-unused-vars
            Note storage outputNotePtr = registries[msg.sender].notes[noteHash];

            // We manually pack our note struct in Yul, because Solidity can be a bit liberal with gas when doing this
            assembly {
                // Load the status flag for this note - we check this equals DOES_NOT_EXIST outside asm block
                outputNoteStatusOld := and(sload(outputNotePtr_slot), 0xff)

                // Write a new note into storage
                sstore(
                    outputNotePtr_slot,
                    // combine `status`, `createdOn` and `owner` via logical OR opcodes
                    or(
                        or(
                            // `status` occupies byte position 0
                            and(outputNoteStatusNew, 0xff), // mask to 1 byte (uint8)
                            // `createdOn` occupies byte positions 1-5 => shift by 8 bits
                            shl(8, and(timestamp, 0xffffffffff)) // mask timestamp to 40 bits
                        ),
                        // `owner` occupies byte positions 11-31 => shift by 88 bits
                        shl(88, noteOwner) // noteOwner already of address type, no need to mask
                    )
                )
            }
            require(outputNoteStatusOld == uint256(NoteStatus.DOES_NOT_EXIST), "output note exists");
        }
    }
}
