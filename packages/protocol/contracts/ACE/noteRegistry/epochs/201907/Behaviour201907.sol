pragma solidity >=0.5.0 <0.6.0;

import "../../../../interfaces/IAZTEC.sol";
import "../../../../libs/NoteUtils.sol";
import "../../interfaces/NoteRegistryBehaviour.sol";
import "../../NoteRegistryManager.sol";

/**
 * @title Behaviour201907
 * @author AZTEC
 * @dev Details the methods and the storage schema of a note registry.
        Is an ownable contract, and should always inherrit from the previous
        epoch of the behaviour contract. This contract defines the shared methods
        between all asset types for the 201907 generation (epoch 1).
 * Methods are documented in interface.
 *
 * Copyright 2020 Spilsbury Holdings Ltd 
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/
contract Behaviour201907 is NoteRegistryBehaviour {
    using NoteUtils for bytes;

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
        uint256 scalingFactor;
        bytes32 confidentialTotalMinted;
        bytes32 confidentialTotalBurned;
        bool canConvert;
        bool canAdjustSupply;
        mapping(bytes32 => Note) notes;
    }

    Registry public registry;
    bytes32 public constant ZERO_VALUE_NOTE_HASH = 0x26d21f105b054b61e8d9680855c3af0633bd7c140b87de95f0ac218046fc71db;
    constructor () NoteRegistryBehaviour() public {}

    function initialise(
        address _newOwner,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public {
        require(initialised != true, "registry already initialised");
        _transferOwnership(_newOwner);

        dataLocation = msg.sender;

        registry = Registry({
            active: true,
            scalingFactor: _scalingFactor,
            confidentialTotalMinted: ZERO_VALUE_NOTE_HASH,
            confidentialTotalBurned: ZERO_VALUE_NOTE_HASH,
            canConvert: _canConvert,
            canAdjustSupply: _canAdjustSupply
        });

        initialised = true;
    }

    function getRegistry() public view returns (
        uint256 scalingFactor,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        bool canConvert,
        bool canAdjustSupply
    ) {
        require(registry.active == true, "expected registry to be created");
        scalingFactor = registry.scalingFactor;
        confidentialTotalMinted = registry.confidentialTotalMinted;
        confidentialTotalBurned = registry.confidentialTotalBurned;
        canConvert = registry.canConvert;
        canAdjustSupply = registry.canAdjustSupply;
    }

    function burn(bytes memory /* _proofOutputs */) public onlyOwner {
        require(registry.canAdjustSupply == true, "this asset is not burnable");
    }

    function mint(bytes memory  /* _proofOutputs */) public onlyOwner {
        require(registry.canAdjustSupply == true, "this asset is not mintable");
    }

    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public onlyOwner returns (
        address publicOwner,
        uint256 transferValue,
        int256 publicValue
    ) {
        require(registry.active == true, "note registry does not exist for the given address");
        bytes memory inputNotes;
        bytes memory outputNotes;
        (
            inputNotes,
            outputNotes,
            publicOwner,
            publicValue
        ) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);

        // If publicValue != 0, enact a token transfer if asset is convertible
        if (publicValue != 0) {
            require(registry.canConvert == true, "asset cannot be converted into public tokens");
            if (publicValue < 0) {
                transferValue = uint256(-publicValue).mul(registry.scalingFactor);
            } else {
                transferValue = uint256(publicValue).mul(registry.scalingFactor);
            }
        }
    }

    function setConfidentialTotalMinted(bytes32 /* newTotalNoteHash */) internal onlyOwner returns (bytes32) {
        require(registry.canAdjustSupply == true, "this asset is not mintable");

    }

    function setConfidentialTotalBurned(bytes32 /* newTotalNoteHash */) internal onlyOwner returns (bytes32) {
        require(registry.canAdjustSupply == true, "this asset is not burnable");
    }

    function getNote(bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    ) {
        require(
            registry.notes[_noteHash].status != uint8(NoteStatus.DOES_NOT_EXIST),
            "expected note to exist"
        );
        Note storage notePtr = registry.notes[_noteHash];
        assembly {
            let note := sload(notePtr_slot)
            status := and(note, 0xff)
            createdOn := and(shr(8, note), 0xffffffffff)
            destroyedOn := and(shr(48, note), 0xffffffffff)
            noteOwner := and(shr(88, note), 0xffffffffffffffffffffffffffffffffffffffff)
        }
    }

    function updateInputNotes(bytes memory inputNotes) internal {
        uint256 length = inputNotes.getLength();

        for (uint256 i = 0; i < length; i += 1) {
            (address noteOwner, bytes32 noteHash,) = inputNotes.get(i).extractNote();
            deleteNote(noteHash, noteOwner);

        }
    }

    function updateOutputNotes(bytes memory outputNotes) internal {
        uint256 length = outputNotes.getLength();

        for (uint256 i = 0; i < length; i += 1) {
            (address noteOwner, bytes32 noteHash,) = outputNotes.get(i).extractNote();
            require(noteOwner != address(0x0), "output note owner cannot be address(0x0)");
            createNote(noteHash, noteOwner);
        }
    }

    function createNote(bytes32 _noteHash, address _noteOwner) internal {
        // set up some temporary variables we'll need
        uint256 noteStatus = uint256(NoteStatus.UNSPENT);

        Note storage notePtr = registry.notes[_noteHash];
        require(notePtr.status == uint256(NoteStatus.DOES_NOT_EXIST), "output note exists");
        // We manually pack our note struct in Yul, because Solidity can be a bit liberal with gas when doing this
        assembly {
            // Write a new note into storage
            sstore(
                notePtr_slot,
                // combine `status`, `createdOn` and `owner` via logical OR opcodes
                or(
                    or(
                        // `status` occupies byte position 0
                        and(noteStatus, 0xff), // mask to 1 byte (uint8)
                        // `createdOn` occupies byte positions 1-5 => shift by 8 bits
                        shl(8, and(timestamp, 0xffffffffff)) // mask timestamp to 40 bits
                    ),
                    // `owner` occupies byte positions 11-31 => shift by 88 bits
                    shl(88, _noteOwner) // _noteOwner already of address type, no need to mask
                )
            )
        }
    }

    function deleteNote(bytes32 _noteHash, address _noteOwner) internal {
        // set up some temporary variables we'll need
        // N.B. the status flags are NoteStatus enums, but written as uint8's.
        // We represent them as uint256 vars because it is the enum values that enforce type safety.
        // i.e. if we include enums that range beyond 256,
        // casting to uint8 won't help because we'll still be writing/reading the wrong note status
        // To summarise the summary - validate enum bounds in tests, use uint256 to save some gas vs uint8
        // set up some temporary variables we'll need
        uint256 noteStatusNew = uint256(NoteStatus.SPENT);
        uint256 noteStatusOld;
        address storedNoteOwner;

        Note storage notePtr = registry.notes[_noteHash];
        // We manually pack our note struct in Yul, because Solidity can be a bit liberal with gas when doing this
        // Update the status of each `note`:
        // 1. set the note status to SPENT
        // 2. update the `destroyedOn` timestamp to the current timestamp
        // We also must check the following:
        // 1. the note has an existing status of UNSPENT
        // 2. the note owner matches the provided input
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
        require(storedNoteOwner == _noteOwner, "input note owner does not match");
    }

    function makeAvailable() public {}
}
