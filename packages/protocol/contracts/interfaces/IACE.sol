pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../ACE/NoteRegistry.sol";
import "../interfaces/IAZTEC.sol";

import "../libs/NoteUtils.sol";
import "../libs/ProofUtils.sol";
import "../libs/SafeMath8.sol";

/**
 * @title IACE
 * @author AZTEC
 * @dev Standard defining the interface for ACE.sol
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
interface IACE {

    function mint(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);

    function burn(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);

    function validateProof(uint24 _proof, address _sender, bytes calldata) external returns (bytes memory);

    function clearProofByHashes(uint24 _proof, bytes32[] calldata _proofHashes) external;

    function setCommonReferenceString(bytes32[6] calldata _commonReferenceString) external;

    function invalidateProof(uint24 _proof) external;

    function validateProofByHash(
        uint24 _proof,
        bytes32 _proofHash,
        address _sender
    ) external view returns (bool);

    function setProof(
        uint24 _proof,
        address _validatorAddress
    ) external;

    function incrementLatestEpoch() external;

    function getCommonReferenceString() external view returns (bytes32[6] memory);

    function getValidatorAddress(uint24 _proof) external view returns (address validatorAddress);

    function getNote(address _registryOwner, bytes32 _noteHash) external view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );
}

