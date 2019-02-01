pragma solidity ^0.4.24;

import "../ACE/ACE.sol";
import "../ACE/NoteRegistry.sol";
import "../ACE/NoteUtilities.sol";

// TODO: EIP-712 signatures are a pain because the domain hash requires 'chainId'.
// We could deploy a bunch of 'Oracle' contracts to relevant testnets/mainnet that 
// just returns the chain Id.

library EIP712Utils {

    bytes32 private constant EIP_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name, string version, uint256 chainId, address verifyingContract)"
    );

    function constructDomainHash(
        bytes32 contractName,
        bytes32 version,
        uint chainId
    ) internal view returns (bytes32 domainHash) {
        bytes32 versionHash = keccak256(abi.encode(version));
        bytes32 contractNameHash = keccak256(abi.encode(contractName));
        bytes32 domainTypeHash = EIP_DOMAIN_TYPEHASH;
        assembly {
            let m := mload(0x40)
            mstore(m, domainTypeHash)
            mstore(add(m, 0x20), contractNameHash)
            mstore(add(m, 0x40), versionHash)
            mstore(add(m, 0x60), chainId) // chain id
            mstore(add(m, 0x80), address) // verifying contract
            domainHash := keccak256(m, 0xa0)
        }
    }

    function recoverSignature(
        bytes32 signatureMessage,
        bytes memory signature
    ) internal view returns (address signer) {
        bool result;
        assembly {
            let r := mload(add(signature, 0x20))
            let s := mload(add(signature, 0x40))
            let v := byte(0, mload(add(signature, 0x60)))
            let m := mload(0x40)
            mstore(m, signatureMessage)
            mstore(add(m, 0x20), v)
            mstore(add(m, 0x40), r)
            mstore(add(m, 0x60), s)
            result := and(
                and(
                    eq(mload(signature), 0x41),
                    or(eq(v, 27), eq(v, 28))
                ),
                staticcall(gas, 0x01, m, 0x80, m, 0x20)
            )
            signer := mload(m)
        }
        require(result, "signature recovery failed!");
        require(signer != address(0), "signer address cannot be 0");
    }
}

contract ZkERC20 {

    using NoteUtilities for bytes;

    ACE public ace;
    ERC20 public linkedToken;
    NoteRegistry public noteRegistry;
    NoteRegistry.Flags public flags;
    uint256 public scalingFactor;
    mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
    bytes32 public domainHash;

    bytes32 private constant NOTE_SIGNATURE_TYPEHASH = keccak256(
        "NoteSignature(bytes32 noteHash, address spender, bool status)"
    );

    event LogCreateNoteRegistry(address noteRegistry);

    event LogCreateZkERC20(
        bool canMint,
        bool canBurn,
        bool canConvert,
        uint256 scalingFactor,
        address linkedToken,
        address ace
    );

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
        noteRegistry = NoteRegistry(ace.createNoteRegistry(
            _canMint,
            _canBurn,
            _canConvert,
            _scalingFactor,
            _linkedToken
        ));
        domainHash = EIP712Utils.constructDomainHash("ZkERC20", "0.1.0", 1);
        emit LogCreateNoteRegistry(noteRegistry);
        emit LogCreateZkERC20(
            _canMint,
            _canBurn,
            _canConvert,
            _scalingFactor,
            _linkedToken,
            _ace
        );
    }
    
    function confidentialTransfer(bytes _proofData) external returns (bool) {
        bytes memory proofOutputs = ace.validateProof(1, msg.sender, _proofData);
        require(proofOutputs.length != 0, "proof invalid!");
        bytes memory proofOutput = proofOutputs.get(0);
        
        
        require(ace.updateNoteRegistry(proofOutput, 1, this), "could not update note registry!");
        
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
            address noteOwner
        ) = noteRegistry.registry(_noteHash);

        require(status == 1, "only unspent notes can be approved");

        // validate EIP-712 signature
        address signer = EIP712Utils.recoverSignature(
            constructSignatureMessage(
                _noteHash,
                _spender,
                _status
            ),
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

    function constructSignatureMessage(
        bytes32 noteHash,
        address spender,
        bool status
    ) internal view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(
            NOTE_SIGNATURE_TYPEHASH,
            noteHash,
            spender,
            status
        ));
        return keccak256(abi.encodePacked(
            "\x19\x01",
            domainHash,
            structHash
        ));
    }
}
