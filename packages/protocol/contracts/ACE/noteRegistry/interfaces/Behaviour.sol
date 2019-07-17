pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../../../interfaces/IAZTEC.sol";
import "../../../libs/NoteUtils.sol";
import "./Data.sol";

/**
 * @title NoteRegistryBehaviour contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev TODO
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract NoteRegistryBehaviour is Ownable, IAZTEC {
    using NoteUtils for bytes;
    using SafeMath for uint256;

    NoteRegistryData public noteRegistryData;
    bool public isActiveBehaviour;

    function transferDataContract(address _newOwner) public;

    /**
    * @dev Call transferFrom on a linked ERC20 token. Used in cases where the ACE's mint
    * function is called but the token balance of the note registry in question is
    * insufficient
    *
    * @param _value the value to be transferred
    */
    function supplementTokens(uint256 _value) external;

    /**
    * @dev Burn AZTEC notes
    * TODO
    */
    function burn(bytes calldata _proofOutputs) external;

    /**
    * @dev Mint AZTEC notes
    * TODO
    */
    function mint(bytes calldata _proofOutputs) external;

    /**
    * @dev Update the state of the note registry according to transfer instructions issued by a
    * zero-knowledge proof
    *
    * @param _proof - unique identifier for a proof
    * @param _proofOutput - transfer instructions issued by a zero-knowledge proof
    * @param _proofSender - address of the entity sending the proof
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput,
        address _proofSender
    ) public;

    /**
    * @dev This should be called from an asset contract.
    */
    function publicApprove(address _publicOwner, bytes32 _proofHash, uint256 _value) public;

    function setConfidentialTotalMinted(bytes32 newTotalNoteHash) internal returns (bytes32);

    function setConfidentialTotalBurned(bytes32 newTotalNoteHash) internal returns (bytes32);

    /**
     * @dev Returns the registry for a given address.
     *
     * @return linkedTokenAddress - public ERC20 token that is linked to the NoteRegistry. This is used to
     * transfer public value into and out of the system
     * @return scalingFactor - defines how many ERC20 tokens are represented by one AZTEC note
     * @return totalSupply - TODO
     * @return confidentialTotalMinted - keccak256 hash of the note representing the total minted supply
     * @return confidentialTotalBurned - keccak256 hash of the note representing the total burned supply
     * @return canConvert - flag set by the owner to decide whether the registry has public to private, and
     * vice versa, conversion privilege
     * @return canAdjustSupply - determines whether the registry has minting and burning privileges
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
     * @dev Returns the note for a given address and note hash.
     *
     * @param _noteHash - keccak256 hash of the note coordiantes (gamma and sigma)
     * @return status - status of the note, details whether the note is in a note registry
     * or has been destroyed
     * @return createdOn - time the note was created
     * @return destroyedOn - time the note was destroyed
     * @return noteOwner - address of the note owner
     */
    function getNote(bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );

    /**
     * @dev Removes input notes from the note registry
     *
     * @param inputNotes - an array of input notes from a zero-knowledge proof, that are to be
     * removed and destroyed from a note registry
     */
    function updateInputNotes(bytes memory inputNotes) internal;

    /**
     * @dev Adds output notes to the note registry
     *
     * @param outputNotes - an array of output notes from a zero-knowledge proof, that are to be
     * added to the note registry
     */
    function updateOutputNotes(bytes memory outputNotes) internal;
}
