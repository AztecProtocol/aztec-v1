pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../interfaces/IAZTEC.sol";

import "../libs/IntegerUtils.sol";
import "../libs/NoteUtils.sol";

contract NoteRegistry is IAZTEC {
    using NoteUtils for bytes;
    using SafeMath for uint256;
    using IntegerUtils for uint256;

    // AZTEC uses timestamps to measure the age of a note, on timescales of days/months
    // The 900-ish seconds a miner can manipulate a timestamp should have little effect
    // solhint-disable-next-line not-rely-on-time
    //
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
        bytes5 createdOn;

        // `destroyedOn` logs the timestamp of the block that destroys this note in a transaction.
        // Default value is 0x0000000000 for notes that have not been spent.
        bytes5 destroyedOn;

        // The owner of the note
        address owner;
    }

    struct Flags {
        bool active;
        bool canMint;
        bool canBurn;
        bool canConvert;
    }

    struct Registry {
        Flags flags;
        ERC20 linkedToken;
        mapping(bytes32 => Note) notes;
        uint256 scalingFactor;
        uint256 totalSupply;
        bytes32 confidentialTotalSupply;
        mapping(address => mapping(bytes32 => uint256)) publicApprovals;
    }

    // Every user has their own note registry
    mapping(address => Registry) internal registries;

    mapping(bytes32 => bool) public validatedProofs;

    function validateProofByHash(uint24 _proof, bytes32 _proofHash, address _sender) public view returns (bool);

    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canMint,
        bool _canBurn,
        bool _canConvert
    ) public {
        require(registries[msg.sender].flags.active == false, "address already has a linked note registry");
        Registry memory registry = Registry({
            linkedToken: ERC20(_linkedTokenAddress),
            scalingFactor: _scalingFactor,
            totalSupply: 0,
            confidentialTotalSupply: bytes32(0x0),
            flags: Flags({
                active: true,
                canMint: _canMint,
                canBurn: _canBurn,
                canConvert: _canConvert
            })
        });
        registries[msg.sender] = registry;
    }

    function updateNoteRegistry(
        uint24 _proof,
        address _proofSender,
        bytes memory _proofOutput
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
            require(flags.canMint == false, "mintable assets cannot be converted into public tokens");
            require(flags.canBurn == false, "burnable assets cannot be converted into public tokens");
            require(flags.canConvert == true, "this asset cannot be converted into public tokens");

            if (publicValue < 0) {
                uint256 publicApprovals = registry.publicApprovals[publicOwner][proofHash];
                registry.totalSupply = registry.totalSupply.add(uint256(-publicValue));
                require(
                    publicApprovals >= uint256(-publicValue),
                    "public owner has not validated a transfer of tokens"
                );
                registry.publicApprovals[publicOwner][proofHash] =
                    publicApprovals.sub(uint256(-publicValue));
                registry.linkedToken.transferFrom(publicOwner, address(this), uint256(-publicValue));
            } else {
                registry.totalSupply = registry.totalSupply.sub(uint256(publicValue));
                registry.linkedToken.transfer(publicOwner, uint256(publicValue));
            }
        }
    }

    function mint(bytes memory _proofOutput, address _proofSender) public returns (bool) {
        Registry storage registry = registries[msg.sender];
        require(registry.flags.active == false, "note registry does not exist for the given address");
        require(registry.flags.canMint == true, "this asset is not mintable");
        bytes32 proofHash = keccak256(_proofOutput);
        require(
            validateProofByHash(JOIN_SPLIT_PROOF, proofHash, _proofSender) == true, 
            "ACE has not validated a matching proof"
        ); 
        
        (bytes memory inputNotes, bytes memory outputNotes, , int256 publicValue) = _proofOutput.extractProofOutput();
        require(publicValue == 0, "mint transactions cannot have a public value");
        require(outputNotes.getLength() > 0, "mint transactions require at least one output note");
        require(inputNotes.getLength() == JOIN_SPLIT_PROOF, "mint transactions can only have one input note");
        
        (, bytes32 noteHash, ) = outputNotes.get(0).extractNote();
        require(noteHash == registry.confidentialTotalSupply, "provided total supply note does not match");
       
        (, noteHash, ) = inputNotes.get(0).extractNote();
        registry.confidentialTotalSupply = noteHash;

        for (uint256 i = 1; i < outputNotes.getLength(); i++) {
            address noteOwner;
            (noteOwner, noteHash, ) = outputNotes.get(i).extractNote();
            Note storage note = registry.notes[noteHash];
            require(note.status == 0, "output note exists");
            note.status = uint8(1);
            // AZTEC uses timestamps to measure the age of a note on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.createdOn = now.toBytes5();
            note.owner = noteOwner;
        }
    }

    function burn(bytes memory _proofOutput, address _proofSender) public returns (bool) {
        Registry storage registry = registries[msg.sender];
        require(registry.flags.active == true, "note registry does not exist for the given address");
        require(registry.flags.canBurn == true, "asset not burnable");
        bytes32 proofHash = keccak256(_proofOutput);
        require(
            validateProofByHash(JOIN_SPLIT_PROOF, proofHash, _proofSender) == true,
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

        for (uint256 i = 1; i < inputNotes.getLength(); i++) {
            address noteOwner;
            (noteOwner, noteHash, ) = outputNotes.get(i).extractNote();
            Note storage note = registry.notes[noteHash];
            require(note.status == 1, "input note does not exist");
            require(note.owner == noteOwner, "input note owner does not match");
            note.status = uint8(2);
            // AZTEC uses timestamps to measure the age of a note, on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.destroyedOn = now.toBytes5();
        }
    }

    /** 
    * @dev This should be called from an asset contract.
    */
    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) public {
        Registry storage registry = registries[_registryOwner];
        require(registry.flags.active == true, "note registry does not exist!");
        registry.publicApprovals[msg.sender][_proofHash] = _value;
    }

    /**
     * @dev Returns the registry for a given address.
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
        Registry memory registry = registries[_owner];
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
     * @dev Returns the note for a given address and note hash.
     */
    function getNote(address _registryOwner, bytes32 _noteHash) public view returns (
        uint8 status,
        bytes5 createdOn,
        bytes5 destroyedOn,
        address noteOwner
    ) {
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
        for (uint256 i = 0; i < length; i++) {
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
                            // a NOT opcode to reduce contract bytecode size
                            not(0xffffffffff0000000000ff)
                        ),
                        // Now that we have zeroed out storage locations of `status` and `destroyedOn`, update them
                        or(
                            // Create 5-byte timestamp and shift into byte positions 6-11 with a bit shift
                            shl(48, and(timestamp, 0xffffffffff)),
                            // Combine with the new note status (masked to a uint8) with a logical OR
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

    function updateOutputNotes(bytes memory outputNotes) internal {

        // set up some temporary variables we'll need
        uint256 outputNoteStatusNew = uint256(NoteStatus.UNSPENT);
        uint256 outputNoteStatusOld;
        uint256 length = outputNotes.getLength();

        for (uint256 i = 0; i < length; i++) {
            (address noteOwner, bytes32 noteHash,) = outputNotes.get(i).extractNote();
            require(noteOwner != address(0x0), "output note owner cannot be address(0x0)!");

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
                            shl(8, and(timestamp, 0xffffffffff)) // mask timestamp to 5 bytes (bytes5)
                        ),
                        // `owner` occupies byte positions 11-31 => shift by 88 bits
                        shl(88, noteOwner) // noteOwner already of address type, no need to mask
                    )
                )
            }
            require(outputNoteStatusOld == uint256(NoteStatus.DOES_NOT_EXIST), "output note exists!");
        }
    }
}
