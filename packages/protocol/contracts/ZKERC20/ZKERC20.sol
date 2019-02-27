pragma solidity >=0.5.0 <0.6.0;

import "../ACE/ACE.sol";
import "../libs/LibEIP712.sol";

contract ZKERC20 is LibEIP712 {
    using NoteUtils for bytes;
    
    // Hash for the EIP712 Note Signature schema
    /* solhint-disable */
    bytes32 constant internal NOTE_SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(
        "NoteSignature(",
        "bytes32 noteHash,",
        "address spender,",
        "bool status",
        ")"
    ));

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "ZKERC20";

    ACE public ace;
    ERC20 public linkedToken;
    NoteRegistry public noteRegistry;
    NoteRegistry.Flags public flags;

    string public name;
    uint256 public scalingFactor;
    mapping(bytes32 => mapping(address => bool)) public confidentialApproved;

    event LogCreateNoteRegistry(address noteRegistry);
    event LogCreateZKERC20(
        bool canMint,
        bool canBurn,
        bool canConvert,
        uint256 scalingFactor,
        address linkedToken,
        address ace
    );
    event LogCreateNote(bytes32 indexed _noteHash, address indexed _owner, bytes _metadata);
    event LogDestroyNote(bytes32 indexed _noteHash, address indexed _owner, bytes _metadata);
    event LogConvertTokens(address indexed _owner, uint256 _value);
    event LogRedeemTokens(address indexed _owner, uint256 _value);

    /* solhint-enable */
    constructor(
        string memory _name,
        bool _canMint,
        bool _canBurn,
        bool _canConvert,
        uint256 _scalingFactor,
        address _linkedTokenAddress,
        address _aceAddress
    ) public {
        name = _name;
        flags = NoteRegistry.Flags(_canMint, _canBurn, _canConvert);
        scalingFactor = _scalingFactor;
        ace = ACE(_aceAddress);
        linkedToken = ERC20(_linkedTokenAddress);
        noteRegistry = NoteRegistry(ace.createNoteRegistry(
            _canMint,
            _canBurn,
            _canConvert,
            _scalingFactor,
            _linkedTokenAddress
        ));
        emit LogCreateNoteRegistry(address(noteRegistry));
        emit LogCreateZKERC20(
            _canMint,
            _canBurn,
            _canConvert,
            _scalingFactor,
            _linkedTokenAddress,
            _aceAddress
        );
    }
    
    function confidentialTransfer(bytes calldata _proofData) external returns (bool) {
        bytes memory proofOutputs = ace.validateProof(1, msg.sender, _proofData);
        require(proofOutputs.length != 0, "proof invalid!");
        bytes memory proofOutput = proofOutputs.get(0);
        
        
        require(ace.updateNoteRegistry(proofOutput, 1, address(this)), "could not update note registry!");
        
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

    function confidentialTransferFrom(uint16 _proofId, bytes calldata _proofOutput) external returns (bool) {
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
        bytes memory _signature
    ) public returns (bool) {
        (
            uint8 status,
            ,
            ,
            address noteOwner
        ) = noteRegistry.registry(_noteHash);

        require(status == 1, "only unspent notes can be approved");

        // validate EIP712 signature
        bytes32 hashStruct = keccak256(abi.encode(
            NOTE_SIGNATURE_TYPEHASH,
            _noteHash,
            _spender,
            status
        ));
        address signer = recoverSignature(
            hashEIP712Message(hashStruct),
            _signature
        );
        require(signer == noteOwner, "the note owner did not sign this message!");
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
