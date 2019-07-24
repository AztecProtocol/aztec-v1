pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../../../interfaces/IAZTEC.sol";
import "../proxies/BaseAdminUpgradeabilityProxy.sol";
import "../Manager.sol";

/**
 * @title NoteRegistryBehaviour contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev TODO
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

    function initialise(
        address _newOwner,
        address /* _linkedTokenAddress */,
        uint256 /* _scalingFactor */,
        bool /* _canAdjustSupply */,
        bool /* _canConvert */
    ) public {
        require(initialised != true, "registry already initialised");
        _transferOwnership(_newOwner);

        dataLocation = msg.sender;
        initialised = true;
    }

    function getRegistry() public view returns (
        address linkedToken,
        uint256 scalingFactor,
        uint256 totalSupply,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        bool canConvert,
        bool canAdjustSupply
    );

    function supplementTokens(uint256 _value) external;

    function burn(bytes calldata _proofOutputs) external;

    function mint(bytes calldata _proofOutputs) external;

    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public;

    function publicApprove(address _publicOwner, bytes32 _proofHash, uint256 _value) public;

    function setConfidentialTotalMinted(bytes32 newTotalNoteHash) internal returns (bytes32);

    function setConfidentialTotalBurned(bytes32 newTotalNoteHash) internal returns (bytes32);

    function getNote(bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );

    function updateInputNotes(bytes memory inputNotes) internal;

    function updateOutputNotes(bytes memory outputNotes) internal;

    function createNote(bytes32 _noteHash, address _noteOwner) internal;

    function deleteNote(bytes32 _noteHash, address _noteOwner) internal;
}
