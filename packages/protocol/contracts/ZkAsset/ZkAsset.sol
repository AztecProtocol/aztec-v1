pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./IZkAsset.sol";
import "../ACE/ACE.sol";
import "../interfaces/IAZTEC.sol";
import "../interfaces/IEIP712.sol";
import "../utils/ProofUtils.sol";

contract ZkAsset is IZkAsset, IAZTEC, IEIP712 {
    using NoteUtils for bytes;
    using SafeMath for uint256;
    
    bytes32 constant internal NOTE_SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(
        "NoteSignature(",
        "bytes32 noteHash,",
        "address spender,",
        "bool status",
        ")"
    ));
    string constant internal EIP712_DOMAIN_NAME = "ZK_ASSET";

    ACE public ace;
    ERC20 public linkedToken;
    ACE.Flags public flags;

    uint256 public scalingFactor;
    mapping(bytes32 => mapping(address => bool)) public confidentialApproved;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public {
        flags = ACE.Flags({
            active: true,
            canMint: false,
            canBurn: false,
            canConvert: true
        });
        ace = ACE(_aceAddress);
        linkedToken = ERC20(_linkedTokenAddress);
        scalingFactor = _scalingFactor;
        ace.createNoteRegistry(
            _linkedTokenAddress,
            _scalingFactor,
            false,
            false,
            true
        );
        emit CreateZkAsset(
            _aceAddress,
            _linkedTokenAddress,
            _scalingFactor
        );
    }
    
    function confidentialTransfer(bytes memory _proofData) public {
        bytes memory proofOutputs = ace.validateProof(JOIN_SPLIT_PROOF, msg.sender, _proofData);
        require(proofOutputs.length != 0, "proof invalid");
        bytes memory proofOutput = proofOutputs.get(0);

        ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proofOutput, address(this));
        
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = proofOutput.extractProofOutput();

        logInputNotes(inputNotes);
        logOutputNotes(outputNotes);
        if (publicValue < 0) {
            emit ConvertTokens(publicOwner, uint256(-publicValue));
        }
        if (publicValue > 0) {
            emit RedeemTokens(publicOwner, uint256(publicValue));
        }
    }

    function confidentialApprove(
        bytes32 _noteHash,
        address _spender,
        bool _status,
        bytes memory _signature
    ) public {
        ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), _noteHash);
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
        emit LogSigner(signer);
        require(signer == noteOwner, "the note owner did not sign this message");
        confidentialApproved[_noteHash][_spender] = _status;
    }

    event LogSigner(address signer);

    function confidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();
        
        uint256 length = inputNotes.getLength();
        for (uint i = 0; i < length; i = i.add(1)) {
            (, bytes32 noteHash, ) = inputNotes.get(i).extractNote();
            require(
                confidentialApproved[noteHash][msg.sender] == true,
                "sender does not have approval to spend input note"
            );
        }

        ace.updateNoteRegistry(_proof, _proofOutput, msg.sender);

        logInputNotes(inputNotes);
        logOutputNotes(outputNotes);

        if (publicValue < 0) {
            emit ConvertTokens(publicOwner, uint256(-publicValue));
        }
        if (publicValue > 0) {
            emit RedeemTokens(publicOwner, uint256(publicValue));
        }
    }

    function publicApprove(bytes32 _proofHash, uint256 _value) public {
        ace.publicApprove(msg.sender, _proofHash, _value);
    }

    function logInputNotes(bytes memory inputNotes) internal {
        for (uint i = 0; i < inputNotes.getLength(); i = i.add(1)) {
            (address noteOwner, bytes32 noteHash, bytes memory metadata) = inputNotes.get(i).extractNote();
            emit DestroyNote(noteOwner, noteHash, metadata);
        }
    }

    function logOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i = i.add(1)) {
            (address noteOwner, bytes32 noteHash, bytes memory metadata) = outputNotes.get(i).extractNote();
            emit CreateNote(noteOwner, noteHash, metadata);
        }
    }
}
