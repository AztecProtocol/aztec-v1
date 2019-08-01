pragma solidity >=0.5.0 <0.6.0;

import "../../ERC1724/ZkAsset.sol";

/**
 * @title ZkAssetBaseTest
 * @author AZTEC 
 * @dev Used for testing purposes
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAssetTest is ZkAsset {
    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAsset(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor
    ) {
    } 
    /**
    * @dev Update the metadata of a note that already exists in storage. 
    * @param noteHash - hash of a note, used as a unique identifier for the note
    * @param updateMetadata - metadata to update the note with. This should be the length of
    * an IES encrypted viewing key, 0x177
    */
    function updateNoteMetaData(bytes32 noteHash, bytes calldata updateMetadata) external {
        // Get the note from this assets registry
        ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);
        require(status == 1, "only unspent notes can be approved");

        // Remove check for only note owner can call this function for testing purposes
        emit UpdateNoteMetadata(noteOwner, noteHash, updateMetadata);
    }



}