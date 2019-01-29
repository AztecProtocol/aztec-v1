pragma solidity 0.4.24;

import "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./ACE.sol";

contract NoteRegistry {
    using NoteUtilities for bytes;

    struct NoteData {
        uint8 status;
        bytes5 createdOn;
        bytes5 destroyedOn;
        address owner;
    }

    uint256 public totalSupply;
    bytes32[4] public totalSupplyPrivate;

    struct Flags {
        bool isPrivate;
        bool isTracked;
    }

    Flags public flags;
    ERC20 public linkedToken;
    ACE public ace;
    uint256 public linkedTokenScalingFactor;
    address public registryOwner;
    mapping(bytes32 => NoteData) public registry;

    constructor(
        bool _isPrivate,
        bool _isTracked,
        address _linkedToken,
        address _owner
    ) public {
        flags = Flags(_isPrivate, _isTracked);
        if (linkedToken != address(0)) {
            linkedToken = ERC20(_linkedToken);
        }
        registryOwner = _owner;
        ace = ACE(msg.sender);
    }

    function updateNoteRegistry(bytes _proofOutput, uint16 _proofType, address _proofSender) public returns (bool) {
        require(msg.sender == registryOwner);
        bytes32 proofHash = _proofOutput.hashProofOutput();
        require(
            ace.validateProofByHash(_proofType, proofHash, _proofSender) == true,
            "ACE has not validated a matching proof"
        );
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);


        if (publicValue != 0) {
            require(flags.isPrivate == false, "private assets cannot have a public value!");
            require(flags.isTracked == true, "untracked assets cannot accept tokens!");
            if (publicValue < 0) {
                require(linkedToken.transferFrom(publicOwner, this, uint256(-publicValue)), "transfer failed!");
                totalSupply += uint256(-publicValue);
            } else {
                require(linkedToken.transfer(publicOwner, uint256(publicValue)), "transfer failed!");
                totalSupply -= uint256(publicValue);
            }
        }

    }

    function updateInputNotes(bytes memory inputNotes) internal {
        for (uint i = 0; i < inputNotes.getLength(); i += 1) {
            (address owner, bytes32 noteHash,) = inputNotes.get(i).extractNote();
            NoteData storage noteData = registry[noteHash];
            require(noteData.status == 1, "input note does not exist!");
            require(noteData.owner == owner, "input note owner does not match!");
            noteData.status = uint8(2);
            // AZTEC uses timestamps to measure the age of a note, on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            noteData.destroyedOn = bytes5(now);
        }
    }

    function updateOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i += 1) {
            (address owner, bytes32 noteHash,) = outputNotes.get(i).extractNote();
            NoteData storage noteData = registry[noteHash];
            require(noteData.status == 0, "output note exists!");
            noteData.status = uint8(1);
            // AZTEC uses timestamps to measure the age of a note on timescales of days/months
            // The 900-ish seconds a miner can manipulate a timestamp should have little effect
            // solhint-disable-next-line not-rely-on-time
            noteData.createdOn = bytes5(now);
            noteData.owner = owner;
        }
    }
}
