pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./ACE.sol";
import "../utils/IntegerUtils.sol";
import "../utils/NoteUtils.sol";

contract NoteRegistry {
    using IntegerUtils for uint;
    using NoteUtils for bytes;

    struct Note {
        uint8 status;
        bytes5 createdOn;
        bytes5 destroyedOn;
        address owner;
    }

    uint256 public totalSupply;
    bytes32 public confidentialTotalSupply;

    struct Flags {
        bool canMint;
        bool canBurn;
        bool canConvert;
    }

    Flags public flags;
    ERC20 public linkedToken;
    ACE public ace;

    uint256 public linkedTokenScalingFactor;
    address public registryOwner;
    mapping(bytes32 => Note) public registry;
    mapping(address => mapping(bytes32 => uint256)) publicApprovals;

    constructor(
        bool _canMint,
        bool _canBurn,
        bool _canConvert,
        uint256 _linkedTokenScalingFactor,
        address _linkedToken,
        address _ace,
        address _owner
    ) public {
        flags = Flags(_canMint, _canBurn, _canConvert);
        if (_linkedToken != address(0)) {
            linkedToken = ERC20(_linkedToken);
        }
        linkedTokenScalingFactor = _linkedTokenScalingFactor;
        registryOwner = _owner;
        ace = ACE(_ace);
    }

    function mint(bytes memory _proofOutput, address _proofSender) public returns (bool) {
        require(msg.sender == registryOwner, "message sender is not registry owner!");
        require(flags.canMint == true, "this asset is not mintable!");
        bytes32 proofHash = _proofOutput.hashProofOutput();
        require(
            ace.validateProofByHash(1, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof!"
        );
        (
            bytes memory inputNotes,
            bytes memory outputNotes,
            ,
            int256 publicValue
        ) = _proofOutput.extractProofOutput();
        require(publicValue == 0, "mint transactions cannot have a public value!");

        require(outputNotes.getLength() > 0, "mint transactions require at least one output note");
        require(inputNotes.getLength() == 1, "mint transactions can only have one input note");
        (
            ,
            bytes32 noteHash,
        ) = outputNotes.get(0).extractNote();
        require(noteHash == confidentialTotalSupply, "provided total supply note does not match!");
        (
            ,
            noteHash,
        ) = inputNotes.get(0).extractNote();

        confidentialTotalSupply = noteHash;

        for (uint i = 1; i < outputNotes.getLength(); i += 1) {
            address owner;
            (owner, noteHash, ) = outputNotes.get(i).extractNote();
            Note storage note = registry[noteHash];
            require(note.status == 0, "output note exists!");
            note.status = uint8(1);
            // AZTEC uses timestamps to measure the age of a note on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.createdOn = now.uintToBytes(5);
            note.owner = owner;
        }
    }

    function burn(bytes memory _proofOutput, address _proofSender) public returns (bool) {
        require(msg.sender == registryOwner, "message sender is not registry owner!");
        require(flags.canBurn == true, "this asset is not burnable!");
        bytes32 proofHash = _proofOutput.hashProofOutput();
        require(
            ace.validateProofByHash(1, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof!"
        );
        (
            bytes memory inputNotes,
            bytes memory outputNotes,
            ,
            int256 publicValue
        ) = _proofOutput.extractProofOutput();
        require(publicValue == 0, "mint transactions cannot have a public value!");

        require(inputNotes.getLength() > 0, "burn transactions require at least one input note");
        require(outputNotes.getLength() == 1, "burn transactions can only have one output note");
        (
            ,
            bytes32 noteHash,
        ) = inputNotes.get(0).extractNote();
        require(noteHash == confidentialTotalSupply, "provided total supply note does not match!");
        (
            ,
            noteHash,
        ) = outputNotes.get(0).extractNote();

        confidentialTotalSupply = noteHash;

        for (uint i = 1; i < inputNotes.getLength(); i += 1) {
            address owner;
            (owner, noteHash, ) = outputNotes.get(i).extractNote();
            Note storage note = registry[noteHash];
            require(note.status == 1, "input note does not exist!");
            require(note.owner == owner, "input note owner does not match!");
            note.status = uint8(2);
            // AZTEC uses timestamps to measure the age of a note, on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.destroyedOn = now.uintToBytes(5);
        }
    }

    function updateNoteRegistry(
        bytes memory _proofOutput, 
        uint16 _proofType, 
        address _proofSender
    ) public returns (bool) {
        require(msg.sender == registryOwner, "message sender is not registry owner!");
        bytes32 proofHash = _proofOutput.hashProofOutput();
        require(
            ace.validateProofByHash(_proofType, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof!"
        );

        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);


        if (publicValue != 0) {
            require(flags.canMint == false, "mintable assets cannot be converted into public tokens!");
            require(flags.canBurn == false, "burnable assets cannot be converted into public tokens!");
            require(flags.canConvert == true, "this asset cannot be converted into public tokens!");
            if (publicValue < 0) {
                totalSupply += uint256(-publicValue);
                require(
                    publicApprovals[publicOwner][proofHash] >= uint256(-publicValue),
                    "public owner has not validated a transfer of tokens"
                );
                publicApprovals[publicOwner][proofHash] -= uint256(-publicValue);
                require(
                    linkedToken.transferFrom(publicOwner, address(this), uint256(-publicValue)), "transfer failed!"
                );
            } else {
                totalSupply -= uint256(publicValue);
                require(linkedToken.transfer(publicOwner, uint256(publicValue)), "transfer failed!");
            }
        }

        return true;
    }

    function publicApprove(bytes32 proofHash, uint256 value) public returns (bool) {
        publicApprovals[msg.sender][proofHash] = value;
        return true;
    }

    function updateInputNotes(bytes memory inputNotes) internal {
        for (uint i = 0; i < inputNotes.getLength(); i += 1) {
            (address owner, bytes32 noteHash,) = inputNotes.get(i).extractNote();
            // `note` will be stored on the blockchain
            Note storage note = registry[noteHash];
            require(note.status == 1, "input note does not exist!");
            require(note.owner == owner, "input note owner does not match!");
            note.status = uint8(2);
            // AZTEC uses timestamps to measure the age of a note, on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.destroyedOn = now.uintToBytes(5);
        }
    }

    function updateOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i += 1) {
            (address owner, bytes32 noteHash,) = outputNotes.get(i).extractNote();
            // `note` will be stored on the blockchain
            Note storage note = registry[noteHash];
            require(note.status == 0, "output note exists!");
            note.status = uint8(1);
            // AZTEC uses timestamps to measure the age of a note on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            note.createdOn = now.uintToBytes(5);
            note.owner = owner;
        }
    }
}
