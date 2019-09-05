pragma solidity >=0.5.0 <0.6.0;

import "../../ERC1724/ZkAsset.sol";
import "../../libs/MetaDataUtils.sol";

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
    * @param metaData - metadata to update the note with
    */
    function updateNoteMetaData(bytes32 noteHash, bytes memory metaData) public {
        ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);
        (, , bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned, , , , bool canAdjustSupply) = ace.getRegistry(address(this));

        // Permissioning check
        bytes32 addressID = keccak256(abi.encodePacked(msg.sender, noteHash));


        // Approve the addresses in the note metaData
        approveAddresses(metaData, noteHash);

        // Set the metaDatatTimeLog to the latest block time
        setMetaDataTimeLog(noteHash);

        emit UpdateNoteMetaData(noteOwner, noteHash, metaData);
    }

}