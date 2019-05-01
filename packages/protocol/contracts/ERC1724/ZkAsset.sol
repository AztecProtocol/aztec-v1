pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../ACE/NoteRegistry.sol";
import "../ACE/ACE.sol";
import "../interfaces/IAZTEC.sol";
import "../interfaces/IZkAsset.sol";
import "../libs/LibEIP712.sol";
import "../libs/ProofUtils.sol";

/**
 * @title ZkAsset
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a confidential asset. 
 * The ownership values and transfer values are encrypted. 
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAsset is IZkAsset, IAZTEC, LibEIP712 {
    using NoteUtils for bytes;
    using SafeMath for uint256;
    

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "ZK_ASSET";

    // EIP712 Domain Version value
    string constant internal EIP712_DOMAIN_VERSION = "1";

    bytes32 constant internal NOTE_SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(
        "NoteSignature(",
            "bytes32 noteHash,",
            "address spender,",
            "bool status",
        ")"
    ));

    bytes32 constant internal JOIN_SPLIT_SIGNATURE_TYPE_HASH = keccak256(abi.encodePacked(
        "JoinSplitSignature(",
            "uint24 proof,",
            "bytes32 noteHash,",
            "uint256 challenge,",
            "address sender",
        ")"
    ));

     // keccak256 hash of "JoinSplitSignature(uint24 proof,bytes32 noteHash,uint256 challenge,address sender)"
    // bytes32 constant internal JOIN_SPLIT_SIGNATURE_TYPE_HASH = 
        // 0xf671f176821d4c6f81e66f9704cdf2c5c12d34bd23561179229c9fe7a9e85462;

    ACE public ace;
    IERC20 public linkedToken;
    NoteRegistry.Flags public flags;

    uint256 public scalingFactor;
    mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
    event Signature(bytes32 number);
    event Status(string status);
    event Value(uint num);
    event GenVar(bytes number);
    event Sender(address sender);
    event Hash(bytes32 number);
    event SignerAddress(address number);
    event SigForConfidentialApprove(bytes number);
    event NoteOwner(address number);
    event RequiredNoteStatus(uint8 number);
    event HashStruct(bytes32 number);
    event MsgHash(bytes32 number);

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public {
        EIP712_DOMAIN_HASH = keccak256(abi.encodePacked(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            bytes32(uint256(address(this)))
        ));
        flags = NoteRegistry.Flags({
            active: true,
            canAdjustSupply: false,
            canConvert: true
        });
        ace = ACE(_aceAddress);
        linkedToken = IERC20(_linkedTokenAddress);
        scalingFactor = _scalingFactor;
        ace.createNoteRegistry(
            _linkedTokenAddress,
            _scalingFactor,
            _canAdjustSupply, // false,
            _canConvert // true
        );
        emit CreateZkAsset(
            _aceAddress,
            _linkedTokenAddress,
            _scalingFactor,
            _canAdjustSupply,
            _canConvert
        );
    }
    
    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes 
    * Will submit _proofData to the validateProof() function of the Cryptography Engine. 
    *
    * Upon successfull verification, it will update note registry state - creating output notes and 
    * destroying input notes.
    * 
    * @param _proofData - bytes variable outputted from a proof verification contract, representing 
    * transfer instructions for the ACE 
    */
    function confidentialTransfer(bytes memory _proofData, bytes memory _signatures) public {
        bytes memory proofOutputs = ace.validateProof(JOIN_SPLIT_PROOF, msg.sender, _proofData);
        confidentialTransferInternal(proofOutputs, _signatures);
    }

        /**
    * @dev Executes a value transfer mediated by smart contracts. The method is supplied with
    * transfer instructions represented by a bytes _proofOutput argument that was outputted
    * from a proof verification contract.
    * 
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables: 
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofOutput - output of a zero-knowledge proof validation contract. Represents
    * transfer instructions for the ACE
    */
    function confidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();
        
        uint256 length = inputNotes.getLength();
        for (uint i = 0; i < length; i += 1) {
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

        /**
    * @dev Perform ECDSA signature validation on a set of notes
    * 
    * @param _noteHash - keccak256 hash of the note coordinates (gamma and sigma)
    * @param _signature - ECDSA signature from the note owner 
    */
    function validateSignature(
        bytes32 _noteHash,
        address _sender, // in confidentialApprove() this variable is the _spender address.
                          // BUT, in confidentialTransfer() this variable is the sender
        bytes memory _signature
    ) public {
        ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), _noteHash);
        emit NoteOwner(noteOwner);
        emit Hash(_noteHash);
        emit RequiredNoteStatus(status);
        emit GenVar(_signature);
        emit Hash(JOIN_SPLIT_SIGNATURE_TYPE_HASH);

        address signer;
        if (_signature.length != 0) {
            // validate EIP712 signature
            bytes32 hashStruct = keccak256(abi.encode(
                JOIN_SPLIT_SIGNATURE_TYPE_HASH,
                JOIN_SPLIT_PROOF,
                _noteHash,
                _sender
            ));
            emit HashStruct(hashStruct);
            bytes32 msgHash = hashEIP712Message(hashStruct);
            emit MsgHash(msgHash);
            signer = recoverSignature(
                msgHash,
                _signature
            );
        } else {
            signer = msg.sender;
        }
        emit SignerAddress(signer);
        emit Status("end of validate signature function");
        // require(signer == noteOwner, "the note owner did not sign this message");
    }

    /**
    * @dev Note owner approving a third party, another address, to spend the note on 
    * owner's behalf. This is necessary to allow the confidentialTransferFrom() method
    * to be called
    * 
    * @param _noteHash - keccak256 hash of the note coordinates (gamma and sigma)
    * @param _spender - address being approved to spend the note
    * @param _status - defines whether the _spender address is being approved to spend the 
    * note, or if permission is being revoked
    * @param _signature - ECDSA signature from the note owner that validates the
    * confidentialApprove() instruction   
    */
    function confidentialApprove(
        bytes32 _noteHash,
        address _spender,
        bool _status,
        bytes memory _signature
    ) public {
        ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), _noteHash);
        require(status == 1, "only unspent notes can be approved");
        address signer;
        if (_signature.length != 0) {
            // validate EIP712 signature
            bytes32 hashStruct = keccak256(abi.encode(
                NOTE_SIGNATURE_TYPEHASH,
                _noteHash,
                _spender,
                status
            ));
            bytes32 msgHash = hashEIP712Message(hashStruct);
            signer = recoverSignature(
                msgHash,
                _signature
            );
        } else {
            signer = msg.sender;
        }
        require(signer == noteOwner, "the note owner did not sign this message");
        confidentialApproved[_noteHash][_spender] = _status;
    }

    function extractSignature(bytes memory _signatures, uint _i) internal pure returns (
        bytes32 v,
        bytes32 r,
        bytes32 s
    ){
        // bytes memory result = new bytes(0x60);

        assembly {
            // callData map of signatures
            // 0x00 - 0x20 : length of signature array
            // 0x20 - 0x40 : first sig, v 
            // 0x40 - 0x60 : first sig, r 
            // 0x60 - 0x80 : first sig, s
            // 0x80 - 0xa0 : second sig, v
            // and so on...
            // Length of a signature = 0x60
            
            v := mload(add(add(_signatures, 0x20), mul(_i, 0x60)))
            r := mload(add(add(_signatures, 0x40), mul(_i, 0x60)))
            s := mload(add(add(_signatures, 0x60), mul(_i, 0x60)))
        }
    }

    
    function confidentialTransferInternal(bytes memory proofOutputs, bytes memory _signatures) internal {
        for (uint i = 0; i < proofOutputs.getLength(); i += 1) {
            bytes memory proofOutput = proofOutputs.get(i);
            ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proofOutput, address(this));
            
            (bytes memory inputNotes,
            bytes memory outputNotes,
            address publicOwner,
            int256 publicValue) = proofOutput.extractProofOutput();
 
            if (inputNotes.getLength() > uint(0)) {
                emit Status("inside the if statement");
                
                for (uint j = 0; j < inputNotes.getLength(); j += 1) {
                    (bytes32 v, bytes32 r, bytes32 s) = extractSignature(_signatures, j);

                    bytes memory result = abi.encode(v, r, s);
                    emit GenVar(result);

                    (, bytes32 noteHash, ) = inputNotes.get(j).extractNote();
                    emit Status("managed to extract note");

                    emit Sender(msg.sender);
                    validateSignature(noteHash, msg.sender, result);
                    emit Status("after signature validation");
                }
            }

            logInputNotes(inputNotes);
            logOutputNotes(outputNotes);
            if (publicValue < 0) {
                emit ConvertTokens(publicOwner, uint256(-publicValue));
            }
            if (publicValue > 0) {
                emit RedeemTokens(publicOwner, uint256(publicValue));
            }
            emit Status("end of confidentialTransferInternal()");

        }
    }

    /**
    * @dev Emit events for all input notes, which represent notes being destroyed
    * and removed from the note registry
    * 
    * @param inputNotes - input notes being destroyed and removed from note registry state
    */
    function logInputNotes(bytes memory inputNotes) internal {
        for (uint i = 0; i < inputNotes.getLength(); i += 1) {
            (address noteOwner, bytes32 noteHash, bytes memory metadata) = inputNotes.get(i).extractNote();
            emit DestroyNote(noteOwner, noteHash, metadata);
        }
    }

    /**
    * @dev Emit events for all output notes, which represent notes being created and added
    * to the note registry
    * 
    * @param outputNotes - outputNotes being created and added to note registry state
    */
    function logOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i += 1) {
            (address noteOwner, bytes32 noteHash, bytes memory metadata) = outputNotes.get(i).extractNote();
            emit CreateNote(noteOwner, noteHash, metadata);
        }
    }
}
