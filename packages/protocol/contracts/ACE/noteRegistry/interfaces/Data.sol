pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../../../interfaces/IAZTEC.sol";
import "../../../libs/NoteUtils.sol";

/**
 * @title NoteRegistryData contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev TODO
 **/
contract NoteRegistryData is Ownable, IAZTEC {
    using NoteUtils for bytes;
    using SafeMath for uint256;

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
        bool canConvert;
        bool canAdjustSupply;
        mapping(bytes32 => Note) notes;
        mapping(address => mapping(bytes32 => uint256)) publicApprovals;
    }

    Registry public registry;

    function createNote(bytes32 _noteHash, address _noteOwner) public;

    function getNote(bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );

    function deleteNote(bytes32 _noteHash, address _noteOwner) public;

    function createPublicApproval(address _publicOwner, bytes32 _proofHash, uint256 _value) public;

    function getPublicApproval(address _publicOwner, bytes32 _proofHash) public view returns (
        uint256 value
    );

    function incrementTotalSupply(uint256 _adjustment) public returns (
        uint256 newTotalSupply
    );

    function decrementTotalSupply(uint256 _adjustment) public returns (
        uint256 newTotalSupply
    );

    function setConfidentialTotalMinted(bytes32 newTotalNoteHash) public returns (bytes32);

    function setConfidentialTotalBurned(bytes32 newTotalNoteHash) public returns (bytes32);
}
