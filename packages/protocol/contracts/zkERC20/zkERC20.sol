pragma solidity ^0.4.24;

import "../ACE/ACE.sol";
import "../ACE/NoteRegistry.sol";
import "../ACE/NoteUtilities.sol";

contract ZkERC20 {

    using NoteUtilities for bytes;

    ACE public ace;
    ERC20 public linkedToken;
    NoteRegistry public noteRegistry;
    NoteRegistry.Flags public flags;
    uint256 public scalingFactor;
    mapping(bytes32 => mapping(address => bool)) public confidentialApproved;

    event LogCreateNote(bytes32 indexed noteHash, address indexed owner, bytes metadata);
    event LogDestroyNote(bytes32 indexed noteHash, address indexed owner, bytes metadata);
    event LogConvertTokens(address indexed owner, uint256 value);
    event LogRedeemTokens(address indexed owner, uint256 value);

    constructor(
        bool _canMint,
        bool _canBurn,
        bool _canConvert,
        uint256 _scalingFactor,
        address _linkedToken,
        address _ace
    ) public {
        flags = NoteRegistry.Flags(_canMint, _canBurn, _canConvert);
        scalingFactor = _scalingFactor;
        ace = ACE(_ace);
        linkedToken = ERC20(_linkedToken);
        noteRegistry = NoteRegistry(ace.createNoteRegistry(_canMint, _canBurn, _canConvert, _scalingFactor));
    }

    function confidentialTransfer(bytes _proofData) external returns (bool) {
        bytes memory proofOutputs = ace.validateProof(1, msg.sender, _proofData);
        require(proofOutputs.length != 0, "proof invalid!");
        bytes memory proofOutput = proofOutputs.get(0);
        require(ace.updateNoteRegistry(proofOutput, 1, msg.sender), "could not update note registry!");

        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = proofOutput.extractProofOutput();

        logInputNotes(inputNotes);
        logOutputNotes(outputNotes);
        if (publicValue < 0) {
            emit LogConvertTokens(publicOwner, uint256(-publicValue));
        }
        if (publicValue > 0) {
            emit LogRedeemTokens(publicOwner, uint256(publicValue));
        }
    }

    function confidentialTransferFrom(uint16 _proofId, bytes _proofOutput) external returns (bool) {
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();
        for (uint i = 0; i < inputNotes.getLength(); i += 1) {
            (, bytes32 noteHash, ) = inputNotes.get(i).extractNote();
            require(
                confidentialApproved[noteHash][msg.sender] == true,
                "sender does not have approval to spend input note!"
            );
        }

        require(
            ace.updateNoteRegistry(_proofOutput, _proofId, msg.sender),
            "could not update note registry!"
        );

        logInputNotes(inputNotes);
        logOutputNotes(outputNotes);
        if (publicValue < 0) {
            emit LogConvertTokens(publicOwner, uint256(-publicValue));
        }
        if (publicValue > 0) {
            emit LogRedeemTokens(publicOwner, uint256(publicValue));
        }
    }

    function confidentialApprove(
        bytes32 _noteHash,
        address _spender,
        bool _status,
        bytes _signature) public returns (bool) {
        (
            uint8 status,
            ,
            ,
            address owner
        ) = noteRegistry.registry(_noteHash);

        require(status == 1, "note status not set to 'unspent'!");
        // TODO: validate EIP-712 signature
        require(_signature.length != 0, "placeholder");
        require(owner != address(0), "placeholder");
        // require(owner == recoverSignature(_signature), "signature does not map to note owner!");
        confidentialApproved[_noteHash][_spender] = _status;
    }

    function logInputNotes(bytes memory inputNotes) internal {
        for (uint i = 0; i < inputNotes.getLength(); i += 1) {
            (address owner, bytes32 noteHash, bytes memory metadata) = inputNotes.get(i).extractNote();
            emit LogDestroyNote(noteHash, owner, metadata);
        }
    }

    function logOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i += 1) {
            (address owner, bytes32 noteHash, bytes memory metadata) = outputNotes.get(i).extractNote();
            emit LogCreateNote(noteHash, owner, metadata);
        }
    }
}
