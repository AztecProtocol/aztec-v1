pragma solidity ^0.4.24;


contract Validator {
  function validate(
    bytes proofData, 
    address sender, 
    bytes32[6] crs
  ) 
    public 
    view 
    returns (bytes memory proofOutputs) 
  {}
}


contract Extractor {
  function extractProofData(bytes memory proofData) 
    internal 
    pure 
    returns (
      bytes[] memory createdNotes,
      bytes[] memory destroyedNotes,
      address publicOwner,
      int256 publicValue
  ) {
    assembly {
      createdNotes := add(mload(add(proofData, 0x20)), proofData)
      destroyedNotes := add(mload(add(proofData, 0x40)), proofData)
      publicOwner := mload(add(proofData, 0x60))
      publicValue := mload(add(proofData, 0x80))
      if iszero(eq(add(add(mload(createdNotes), mload(destroyedNotes)), 0xe0), mload(proofData))) {
        revert(0x00, 0x00)
      }
    }
  }

  function extractNoteData(bytes memory note) 
    internal 
    pure 
    returns (
      bytes32 noteHash,
      address owner,
      bytes memory metadata
  ) {
    assembly {
      if lt(mload(note), 0x80) {
        revert(0x00, 0x00)
      }
      noteHash := mload(add(note, 0x20))
      owner := and(mload(add(note, 0x40)), 0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff)
      metadata := add(note, 0x60)
    }
  }
}


contract ACE {
  bytes32[6] public commonReferenceString;
  address public owner;
  mapping(uint16 => address) private validators;
  mapping(bytes32 => bool) private validatedProofs;

  constructor (
    bytes32[6] _commonReferenceString, 
    address[] _initialProofs, 
    uint16[] _initialProofTypes
  )
    public
  {
    owner = msg.sender;
    commonReferenceString = _commonReferenceString;
    require(
      _initialProofs.length == _initialProofTypes.length, 
      "array length mismatch"
    );
    for (uint i = 0; i < _initialProofs.length; i++) {
      validators[_initialProofTypes[i]] = _initialProofs[i];
    }
  }

  function setCommonReferenceString(
    bytes32[6] _commonReferenceString
  ) 
    external 
  {
    require(msg.sender == owner, "only owner can set common reference string");
    commonReferenceString = _commonReferenceString;
  }

  function validateProof(
    uint16 _proofType, 
    bytes _proofData, 
    address _sender
  ) 
    external 
    returns (
      bytes memory proofData
  ) {
    address validatorAddress = validators[_proofType];
    require(
      validatorAddress != address(0), 
      "expect validator address to exist"
    );
    
    proofData = Validator(validators[_proofType]).validate(
      _proofData, 
      _sender, 
      commonReferenceString
    );
    assembly {
      let m := mload(0x40)
      let numProofOutputs := mload(add(proofData, 0x20))
      for { let i := 0} lt(i, numProofOutputs) { i := add(i, 0x01) } {
        let loc := add(add(proofData, 0x40), mul(i, 0x20))
        let size := mload(loc)
        let proofHash := keccak256(loc, mload(loc))
        mstore(m, proofHash)
        mstore(add(m, 0x20), _proofType)
        mstore(add(m, 0x40), caller)
        let proofId := keccak256(m, 0x60)
        mstore(0x00, proofId)
        mstore(0x20, validatedProofs_slot)
        sstore(keccak256(0x00, 0x40), 0x01)
      }
    }
    return proofData;
  }
}
