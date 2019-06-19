pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../interfaces/IAZTEC.sol";
import "../libs/NoteUtils.sol";
import "../libs/ProofUtils.sol";

/**
 * @title NoteRegistryData contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev TODO
 **/
contract NoteRegistryData is Ownable, IAZTEC {
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

    struct Registry {
        bool active;
        address linkedToken;
        uint256 scalingFactor;
        uint256 totalSupply;
        bytes32 confidentialTotalMinted;
        bytes32 confidentialTotalBurned;
        uint256 supplementTotal;
        bool canAdjustSupply;
        bool canConvert;
        mapping(bytes32 => Note) notes;
        mapping(address => mapping(bytes32 => uint256)) publicApprovals;
    }

    Registry public registry;

    constructor(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public {
        registry = Registry({
            linkedToken: _linkedTokenAddress,
            scalingFactor: _scalingFactor,
            totalSupply: 0,
            confidentialTotalMinted: ZERO_VALUE_NOTE_HASH,
            confidentialTotalBurned: ZERO_VALUE_NOTE_HASH,
            supplementTotal: 0,
            active: true,
            canAdjustSupply: _canAdjustSupply,
            canConvert: _canConvert
        });
    }

    function createNote(bytes memory note) public onlyOwner {
        // set up some temporary variables we'll need
        uint256 noteStatusNew = uint256(NoteStatus.UNSPENT);
        uint256 noteStatusOld;

        (address noteOwner, bytes32 noteHash,) = note.extractNote();
        Note storage notePtr = registry.notes[noteHash];
        // We manually pack our note struct in Yul, because Solidity can be a bit liberal with gas when doing this
        assembly {
            // Load the status flag for this note - we check this equals DOES_NOT_EXIST outside asm block
            noteStatusOld := and(sload(notePtr_slot), 0xff)

            // Write a new note into storage
            sstore(
                notePtr_slot,
                // combine `status`, `createdOn` and `owner` via logical OR opcodes
                or(
                    or(
                        // `status` occupies byte position 0
                        and(noteStatusNew, 0xff), // mask to 1 byte (uint8)
                        // `createdOn` occupies byte positions 1-5 => shift by 8 bits
                        shl(8, and(timestamp, 0xffffffffff)) // mask timestamp to 40 bits
                    ),
                    // `owner` occupies byte positions 11-31 => shift by 88 bits
                    shl(88, noteOwner) // noteOwner already of address type, no need to mask
                )
            )
        }
        require(noteStatusOld == uint256(NoteStatus.DOES_NOT_EXIST), "output note exists");
    }

    function getNote(bytes32 noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    ) {
        Note storage notePtr = registry.notes[noteHash];
        assembly {
            let note := sload(notePtr_slot)
            status := and(note, 0xff)
            createdOn := and(shr(8, note), 0xffffffffff)
            destroyedOn := and(shr(48, note), 0xffffffffff)
            noteOwner := and(shr(88, note), 0xffffffffffffffffffffffffffffffffffffffff)
        }
    }

    function deleteNote(bytes memory note) public onlyOwner {
        // set up some temporary variables we'll need
        uint256 noteStatusNew = uint256(NoteStatus.SPENT);
        uint256 noteStatusOld;
        address storedNoteOwner;

        (address noteOwner, bytes32 noteHash,) = note.extractNote();
        Note storage notePtr = registry.notes[noteHash];
        // We manually pack our note struct in Yul, because Solidity can be a bit liberal with gas when doing this
        assembly {
                // load up our note from storage
                let storedNote := sload(notePtr_slot)

                // extract the status of this note (we'll check that it is UNSPENT outside the asm block)
                noteStatusOld := and(storedNote, 0xff)

                // extract the owner of this note (we'll check that it is _owner outside the asm block)
                storedNoteOwner := and(shr(88, storedNote), 0xffffffffffffffffffffffffffffffffffffffff)

                // update the input note and write it into storage.
                // We need to change its `status` from UNSPENT to SPENT, and update `destroyedOn`
                sstore(
                    notePtr_slot,
                    or(
                        // zero out the bits used to store `status` and `destroyedOn`
                        // `status` occupies byte index 1, `destroyedOn` occupies byte indices 6 - 11.
                        // We create bit mask with a NOT opcode to reduce contract bytecode size.
                        // We then perform logical AND with the bit mask to zero out relevant bits
                        and(
                            storedNote,
                            not(0xffffffffff0000000000ff)
                        ),
                        // Now that we have zeroed out storage locations of `status` and `destroyedOn`, update them
                        or(
                            // Create 5-byte timestamp and shift into byte positions 6-11 with a bit shift
                            shl(48, and(timestamp, 0xffffffffff)),
                            // Combine with the new note status (masked to a uint8)
                            and(noteStatusNew, 0xff)
                        )
                    )
                )
            }
            // Check that the note status is UNSPENT
            require(noteStatusOld == uint256(NoteStatus.UNSPENT), "input note status is not UNSPENT");
            // Check that the note owner is the expected owner
            require(storedNoteOwner == noteOwner, "input note owner does not match");
    }
}
