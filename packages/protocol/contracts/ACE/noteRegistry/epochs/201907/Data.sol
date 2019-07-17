pragma solidity >=0.5.0 <0.6.0;

import "../../interfaces/Data.sol";

/**
 * @title NoteRegistryData contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev TODO
 **/
contract Data201907 is NoteRegistryData {

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

    function createNote(bytes32 _noteHash, address _noteOwner) public onlyOwner {
        // set up some temporary variables we'll need
        uint256 noteStatusNew = uint256(NoteStatus.UNSPENT);
        uint256 noteStatusOld;

        Note storage notePtr = registry.notes[_noteHash];
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
                    shl(88, _noteOwner) // _noteOwner already of address type, no need to mask
                )
            )
        }
        require(noteStatusOld == uint256(NoteStatus.DOES_NOT_EXIST), "output note exists");
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

    function deleteNote(bytes32 _noteHash, address _noteOwner) public onlyOwner {
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

    function createPublicApproval(address _publicOwner, bytes32 _proofHash, uint256 _value)
        public
        onlyOwner
    {
        require(registry.active == true, "note registry does not exist");
        registry.publicApprovals[_publicOwner][_proofHash] = _value;
    }

    function getPublicApproval(address _publicOwner, bytes32 _proofHash) public view returns (
        uint256 value
    ) {
        value = registry.publicApprovals[_publicOwner][_proofHash];
    }

    function incrementTotalSupply(uint256 _adjustment) public onlyOwner returns (
        uint256 newTotalSupply
    ) {
        newTotalSupply = registry.totalSupply.add(_adjustment);
        registry.totalSupply = newTotalSupply;
    }

    function decrementTotalSupply(uint256 _adjustment) public onlyOwner returns (
        uint256 newTotalSupply
    ) {
        newTotalSupply = registry.totalSupply.sub(_adjustment);
        registry.totalSupply = newTotalSupply;
    }

    function setConfidentialTotalMinted(bytes32 newTotalNoteHash) public onlyOwner returns (bytes32) {
        registry.confidentialTotalMinted = newTotalNoteHash;
        return newTotalNoteHash;
    }

    function setConfidentialTotalBurned(bytes32 newTotalNoteHash) public onlyOwner returns (bytes32) {
        registry.confidentialTotalBurned = newTotalNoteHash;
        return newTotalNoteHash;
    }
}
