pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../ACE/ACE.sol";
import "../libs/LibEIP712.sol";

contract ZKERC20 is LibEIP712 {
    using NoteUtils for bytes;
    using SafeMath for uint256;
    
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
    ACE.Flags public flags;

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
        flags = ACE.Flags({
            canMint: _canMint, 
            canBurn: _canBurn, 
            canConvert: _canConvert
        });
        scalingFactor = _scalingFactor;
        ace = ACE(_aceAddress);
        linkedToken = ERC20(_linkedTokenAddress);
        ace.createNoteRegistry(
            _linkedTokenAddress,
            _scalingFactor,
            _canMint,
            _canBurn,
            _canConvert
        );
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
        for (uint i = 0; i < inputNotes.getLength(); i = i.add(1)) {
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
        ) = ace.getNote(msg.sender, _noteHash);

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
        for (uint i = 0; i < inputNotes.getLength(); i = i.add(1)) {
            (address owner, bytes32 noteHash, bytes memory metadata) = inputNotes.get(i).extractNote();
            emit LogDestroyNote(noteHash, owner, metadata);
        }
    }

    function logOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i = i.add(1)) {
            (address owner, bytes32 noteHash, bytes memory metadata) = outputNotes.get(i).extractNote();
            emit LogCreateNote(noteHash, owner, metadata);
        }
    }
}


// pragma solidity >=0.5.0 <0.6.0;

// import "../ACE/ACE.sol";

// library EIP712Utils {

//     bytes32 private constant EIP_DOMAIN_TYPEHASH = keccak256(
//         "EIP712Domain(string name, string version, address verifyingContract)"
//     );

//     function constructDomainHash(
//         bytes32 contractName,
//         bytes32 version
//     ) internal view returns (bytes32 domainHash) {
//         bytes32 versionHash = keccak256(abi.encode(version));
//         bytes32 contractNameHash = keccak256(abi.encode(contractName));
//         bytes32 domainTypeHash = EIP_DOMAIN_TYPEHASH;
//         assembly {
//             let m := mload(0x40)
//             mstore(m, domainTypeHash)
//             mstore(add(m, 0x20), contractNameHash)
//             mstore(add(m, 0x40), versionHash)
//             mstore(add(m, 0x60), address) // verifying contract
//             domainHash := keccak256(m, 0x80)
//         }
//     }

//     function recoverSignature(
//         bytes32 signatureMessage,
//         bytes memory signature
//     ) internal view returns (address signer) {
//         bool result;
//         assembly {
//             let r := mload(add(signature, 0x20))
//             let s := mload(add(signature, 0x40))
//             let v := byte(0, mload(add(signature, 0x60)))
//             let m := mload(0x40)
//             mstore(m, signatureMessage)
//             mstore(add(m, 0x20), v)
//             mstore(add(m, 0x40), r)
//             mstore(add(m, 0x60), s)
//             result := and(
//                 and(
//                     eq(mload(signature), 0x41),
//                     or(eq(v, 27), eq(v, 28))
//                 ),
//                 staticcall(gas, 0x01, m, 0x80, m, 0x20)
//             )
//             signer := mload(m)
//         }
//         require(result, "signature recovery failed!");
//         require(signer != address(0), "signer address cannot be 0");
//     }
// }

// contract ZKERC20 {
//     using NoteUtils for bytes;

//     event LogCreateZKERC20(
//         address ace,
//         address linkedToken,
//         uint256 scalingFactor,
//         bool canMint,
//         bool canBurn,
//         bool canConvert
//     );

//     event LogCreateNote(bytes32 indexed _noteHash, address indexed _owner, bytes _metadata);
//     event LogDestroyNote(bytes32 indexed _noteHash, address indexed _owner, bytes _metadata);
//     event LogConvertTokens(address indexed _owner, uint256 _value);
//     event LogRedeemTokens(address indexed _owner, uint256 _value);

//     ACE public ace;
//     ERC20 public linkedToken;
//     ACE.Flags public flags;

//     string public name;
//     uint256 public scalingFactor;
//     mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
//     bytes32 public domainHash;

//     bytes32 private constant NOTE_SIGNATURE_TYPEHASH = keccak256(
//         "NoteSignature(bytes32 noteHash, address spender, bool status)"
//     );

//     constructor(
//         string memory _name,
//         address _aceAddress,
//         address _linkedTokenAddress,
//         uint256 _scalingFactor,
//         bool _canMint,
//         bool _canBurn,
//         bool _canConvert
//     ) public {
//         name = _name;
//         ace = ACE(_aceAddress);
//         linkedToken = ERC20(_linkedTokenAddress);
//         scalingFactor = _scalingFactor;
//         flags = ACE.Flags({
//             canMint: _canMint, 
//             canBurn: _canBurn, 
//             canConvert: _canConvert
//         });
//         ace.createNoteRegistry(
//             _linkedTokenAddress,
//             _scalingFactor,
//             _canMint,
//             _canBurn,
//             _canConvert
//         );
//         domainHash = EIP712Utils.constructDomainHash("ZKERC20", "0.1.0");
//         emit LogCreateZKERC20(
//             _aceAddress,
//             _linkedTokenAddress,
//             _scalingFactor,
//             _canMint,
//             _canBurn,
//             _canConvert
//         );
//     }
    
//     function confidentialTransfer(bytes calldata _proofData) external returns (bool) {
//         bytes memory proofOutputs = ace.validateProof(1, msg.sender, _proofData);
//         require(proofOutputs.length != 0, "proof invalid!");
//         bytes memory proofOutput = proofOutputs.get(0);
        
//         require(ace.updateNoteRegistry(proofOutput, 1, address(this)), "could not update note registry!");
        
//         (bytes memory inputNotes,
//         bytes memory outputNotes,
//         address publicOwner,
//         int256 publicValue) = proofOutput.extractProofOutput();

//         logInputNotes(inputNotes);
//         logOutputNotes(outputNotes);
//         if (publicValue < 0) {
//             emit LogConvertTokens(publicOwner, uint256(-publicValue));
//         }
//         if (publicValue > 0) {
//             emit LogRedeemTokens(publicOwner, uint256(publicValue));
//         }
//     }

//     function confidentialTransferFrom(uint16 _proofId, bytes calldata _proofOutput) external returns (bool) {
//         (bytes memory inputNotes,
//         bytes memory outputNotes,
//         address publicOwner,
//         int256 publicValue) = _proofOutput.extractProofOutput();
//         for (uint i = 0; i < inputNotes.getLength(); i += 1) {
//             (, bytes32 noteHash, ) = inputNotes.get(i).extractNote();
//             require(
//                 confidentialApproved[noteHash][msg.sender] == true,
//                 "sender does not have approval to spend input note!"
//             );
//         }

//         require(
//             ace.updateNoteRegistry(_proofOutput, _proofId, msg.sender),
//             "could not update note registry!"
//         );

//         logInputNotes(inputNotes);
//         logOutputNotes(outputNotes);
//         if (publicValue < 0) {
//             emit LogConvertTokens(publicOwner, uint256(-publicValue));
//         }
//         if (publicValue > 0) {
//             emit LogRedeemTokens(publicOwner, uint256(publicValue));
//         }
//     }

//     function confidentialApprove(
//         bytes32 _noteHash,
//         address _spender,
//         bool _status,
//         bytes memory _signature
//     ) public returns (bool) {
//         (
//             uint8 status,
//             ,
//             ,
//             address noteOwner
//         ) = ace.getNote(msg.sender, _noteHash);

//         require(status == 1, "only unspent notes can be approved");

//         // validate EIP-712 signature
//         address signer = EIP712Utils.recoverSignature(
//             constructSignatureMessage(
//                 _noteHash,
//                 _spender,
//                 _status
//             ),
//             _signature
//         );
//         require(signer == noteOwner, "the note owner did not sign this message!");
//         confidentialApproved[_noteHash][_spender] = _status;
//     }

//     function logInputNotes(bytes memory inputNotes) internal {
//         for (uint i = 0; i < inputNotes.getLength(); i += 1) {
//             (address owner, bytes32 noteHash, bytes memory metadata) = inputNotes.get(i).extractNote();
//             emit LogDestroyNote(noteHash, owner, metadata);
//         }
//     }

//     function logOutputNotes(bytes memory outputNotes) internal {
//         for (uint i = 0; i < outputNotes.getLength(); i += 1) {
//             (address owner, bytes32 noteHash, bytes memory metadata) = outputNotes.get(i).extractNote();
//             emit LogCreateNote(noteHash, owner, metadata);
//         }
//     }

//     function constructSignatureMessage(
//         bytes32 noteHash,
//         address spender,
//         bool status
//     ) internal view returns (bytes32) {
//         bytes32 structHash = keccak256(abi.encode(
//             NOTE_SIGNATURE_TYPEHASH,
//             noteHash,
//             spender,
//             status
//         ));
//         return keccak256(abi.encodePacked(
//             "\x19\x01",
//             domainHash,
//             structHash
//         ));
//     }
// }
