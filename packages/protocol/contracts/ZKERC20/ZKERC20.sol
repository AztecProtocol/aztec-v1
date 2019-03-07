pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../ACE/ACE.sol";
import "../interfaces/IAZTEC.sol";
import "../interfaces/IEIP712.sol";
import "../utils/ProofUtils.sol";

contract ZKERC20 is IAZTEC, IEIP712 {
    using NoteUtils for bytes;
    using ProofUtils for uint24;
    using SafeMath for uint256;
    
    /* solhint-disable */
    bytes32 constant internal NOTE_SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(
        "NoteSignature(",
        "bytes32 noteHash,",
        "address spender,",
        "bool status",
        ")"
    ));
    string constant internal EIP712_DOMAIN_NAME = "ZKERC20";

    ACE public ace;
    ERC20 public linkedToken;
    ACE.Flags public flags;

    string public name;
    uint256 public scalingFactor;
    mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
    
    bool public isOpen;
    address public owner;
    mapping(uint8 => bool) public epochs;
    mapping(uint8 => mapping(uint8 => bool)) proofs;
    bool private epochsInitialized;
    mapping(uint8 => bool) private proofsInitialized;

    event CreateNoteRegistry(address noteRegistry);
    event CreateZKERC20(
        bool canMint,
        bool canBurn,
        bool canConvert,
        uint256 scalingFactor,
        address linkedToken,
        address ace,
        bool isOpen
    );
    event CreateNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);
    event DestroyNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);
    event ConvertTokens(address indexed owner, uint256 value);
    event RedeemTokens(address indexed owner, uint256 value);
    /* solhint-enable */

    constructor(
        string memory _name,
        bool _canMint,
        bool _canBurn,
        bool _canConvert,
        uint256 _scalingFactor,
        address _linkedTokenAddress,
        address _aceAddress,
        bool _isOpen
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
        isOpen = _isOpen;
        if (!_isOpen) {
            owner = msg.sender;
        }
        emit CreateZKERC20(
            _canMint,
            _canBurn,
            _canConvert,
            _scalingFactor,
            _linkedTokenAddress,
            _aceAddress,
            _isOpen
        );
    }

    function setEpochs(uint8[] calldata _epochs) external {
        require(isOpen == false, "expected the asset to not be open");
        require(msg.sender == owner, "only the owner can set the epochs");
        require(epochsInitialized == false, "expected epoch to not be initialized");
        
        uint256 length = _epochs.length;
        require(length <= 255, "there can only be 255 epochs at maximum");

        for (uint256 i = 0; i < length; i = i.add(1)) {
            uint8 epoch = _epochs[i];
            epochs[epoch] = true;
        }
        epochsInitialized = true;
    }

    function setProofsForEpoch(
        uint8 _epoch,
        uint8[] calldata ids
    ) external {
        require(isOpen == false, "expected the asset to not be open");
        require(msg.sender == owner, "only the owner can set the epoch proofs");
        require(epochs[_epoch] == true, "expected epoch to be supported");
        require(proofsInitialized[_epoch] == false, "expected proofs to not be initialized for given epoch");
        
        uint256 length = ids.length;
        require(length <= 255, "there can only be 255 proofs at maximum");

        uint8 balancedCategory = uint8(ProofCategory.BALANCED);
        for (uint256 i = 0; i < length; i = i.add(1)) {
            uint8 id = ids[i];
            proofs[balancedCategory][id] = true;
        }
        proofsInitialized[_epoch] = true;
    }
    
    function confidentialTransfer(bytes calldata _proofData) external returns (bool) {
        bytes memory proofOutputs = ace.validateProof(JOIN_SPLIT_PROOF, msg.sender, _proofData);
        require(proofOutputs.length != 0, "proof invalid");
        bytes memory proofOutput = proofOutputs.get(0);
        require(ace.updateNoteRegistry(proofOutput, 1, address(this)), "could not update note registry");
        
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

    function confidentialTransferFrom(uint16 _proofId, bytes calldata _proofOutput) external returns (bool) {
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

        require(
            ace.updateNoteRegistry(_proofOutput, _proofId, msg.sender),
            "could not update note registry"
        );

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
    ) public returns (bool) {
        ( uint8 status, , , address noteOwner ) = ace.getNote(msg.sender, _noteHash);
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
        require(signer == noteOwner, "the note owner did not sign this message");
        confidentialApproved[_noteHash][_spender] = _status;
    }

    function supportsProof(uint24 _proof) public view returns (bool) {
        if (isOpen) {
            return true;
        }
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        require(epochs[epoch] == true, "expected epoch to be supported");
        require(category == uint8(ProofCategory.BALANCED), "ZKERC20 only supports balanced proofs");
        return proofs[epoch][id];
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
