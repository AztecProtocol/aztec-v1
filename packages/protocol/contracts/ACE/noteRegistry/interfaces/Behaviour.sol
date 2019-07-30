pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../../../interfaces/IAZTEC.sol";
import "../Manager.sol";
/**
 * @title NoteRegistryBehaviour interface which defines the base API which must be implemented for every behaviour contract.
 * @author AZTEC
 * @dev This interface will mostly be used by ACE, in order to have an API to interact with note registries through proxies.
 * The implementation of all write methods should have an onlyOwner modifier.
 *
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract NoteRegistryBehaviour is Ownable, IAZTEC {
    using SafeMath for uint256;

    bool public isActiveBehaviour;
    bool public initialised;
    address public dataLocation;

    constructor () Ownable() public {
        isActiveBehaviour = true;
    }

    /**
        * @dev Initialises the data of a noteRegistry. Should be called exactly once.
        *
        * @param _newOwner - the address which the initialise call will transfer ownership to
        * @param _linkedTokenAddress - address of any erc20 linked token (can not be 0x0 if canConvert is true)
        * @param _scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
        * @param _canAdjustSupply - whether the noteRegistry can make use of minting and burning
        * @param _canConvert - whether the noteRegistry can transfer value from private to public representation and vice versa
    */
    function initialise(
        address _newOwner,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public;

    /**
        * @dev Fetches data of the registry
        *
        * @return linkedToken - address of any erc20 linked token (can not be 0x0 if canConvert is true)
        * @return scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
        * @return totalSupply - defines the number of public tokens associated with this note registry.
        * @return confidentialTotalMinted - the hash of the AZTEC note representing the total amount which has been minted.
        * @return confidentialTotalBurned - the hash of the AZTEC note representing the total amount which has been burned.
        * @return canConvert - the boolean whih defines if the noteRegistry can convert between public and private.
        * @return canConvert - the boolean whih defines if the noteRegistry can make use of minting and burning methods.
    */
    function getRegistry() public view returns (
        address linkedToken,
        uint256 scalingFactor,
        uint256 totalSupply,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        bool canConvert,
        bool canAdjustSupply
    );

    /**
        * @dev Provides an external method to increment the total supply of the noteRegistry. Used by Manager
        * in the event that a mint opperation happens on a convertible asset
        *
        * @param _value - the amount to increment total supply by
    */
    function incrementTotalSupply(uint256 _value) external;

    /**
        * @dev Enacts the state modifications needed given a successfully validated burn proof
        *
        * @param _proofOutputs - the output of the burn validator
    */
    function burn(bytes calldata _proofOutputs) external;

    /**
        * @dev Enacts the state modifications needed given a successfully validated mint proof
        *
        * @param _proofOutputs - the output of the mint validator
    */
    function mint(bytes calldata _proofOutputs) external;

    /**
        * @dev Enacts the state modifications needed given the output of a successfully validated proof.
        * The _proofId param is used by the behaviour contract to (if needed) restrict the versions of proofs
        * which the note registry supports, useful in case the proofOutputs schema changes for example.
        *
        * @param _proof - the id of the proof
        * @param _proofOutput - the output of the proof validator
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public;

    /**
        * @dev Adds a public approval record to the noteRegistry, for use by ACE when it needs to transfer public tokens it holds
        * to an external address. It needs to be associated with the hash of a proof.
        *
        * @param _publicOwner - the id of the proof
        * @param _proofHash - the output of the proof validator
        * @param _value - the total value approved given the proofHash
    */
    function publicApprove(address _publicOwner, bytes32 _proofHash, uint256 _value) public;

    /**
        * @dev Sets confidentialTotalMinted to a new value. The value must be the hash of a note;
        *
        * @param _newTotalNoteHash - the hash of the note representing the total minted value for an asset.
    */
    function setConfidentialTotalMinted(bytes32 _newTotalNoteHash) internal returns (bytes32);

    /**
        * @dev Sets confidentialTotalBurned to a new value. The value must be the hash of a note;
        *
        * @param _newTotalNoteHash - the hash of the note representing the total burned value for an asset.
    */
    function setConfidentialTotalBurned(bytes32 _newTotalNoteHash) internal returns (bytes32);

    /**
        * @dev Gets a defined note from the note registry, and returns the deconstructed object. This is to avoid the interface to be
        * _too_ opninated on types, even though it does require any subsequent note type to have (or be able to mock) the return fields.
        *
        * @param _noteHash - the hash of the note being fetched
        *
        * @return status - whether a note has been spent or not
        * @return createdOn - timestamp of the creation time of the note
        * @return destroyedOn - timestamp of the time the note was destroyed (if it has been destroyed, 0 otherwise)
        * @return noteOwner - address of the stored owner of the note
    */
    function getNote(bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );

    /**
        * @dev Internal function to update the noteRegistry given a bytes array.
        *
        * @param _inputNotes - a bytes array containing notes
    */
    function updateInputNotes(bytes memory _inputNotes) internal;

    /**
        * @dev Internal function to update the noteRegistry given a bytes array.
        *
        * @param _outputNotes - a bytes array containing notes
    */
    function updateOutputNotes(bytes memory _outputNotes) internal;

    /**
        * @dev Internal function to create a new note object.
        *
        * @param _noteHash - the noteHash
        * @param _noteOwner - the address of the owner of the note
    */
    function createNote(bytes32 _noteHash, address _noteOwner) internal;

    /**
        * @dev Internal function to delete a note object.
        *
        * @param _noteHash - the noteHash
        * @param _noteOwner - the address of the owner of the note
    */
    function deleteNote(bytes32 _noteHash, address _noteOwner) internal;
}
