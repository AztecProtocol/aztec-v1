// pragma solidity >=0.5.0 <0.6.0;

// import "../../ERC1724/ZkAsset.sol";
// import "../../libs/MetaDataUtils.sol";

// /**
//  * @title ZkAssetBaseTest
//  * @author AZTEC 
//  * @dev Used for testing purposes
//  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
//  **/
// contract ZkAssetTest is ZkAsset {
//     constructor(
//         address _aceAddress,
//         address _linkedTokenAddress,
//         uint256 _scalingFactor
//     ) public ZkAsset(
//         _aceAddress,
//         _linkedTokenAddress,
//         _scalingFactor
//     ) {
//     } 
//     /**
//     * @dev Update the metadata of a note that already exists in storage. 
//     * @param noteHash - hash of a note, used as a unique identifier for the note
//     * @param metaData - metadata to update the note with
//     */
//     function updateNoteMetaData(bytes32 noteHash, bytes memory metaData) public {
//         // Get the note from this assets registry
//         (, , bytes32 confidentialTotalMinted, bytes32 confidentialTotalBurned, , , , bytes32 canAdjustSupply) = ace.getRegistry(address(this));


//         if (canAdjustSupply == true) {
//             if ((confidentialTotalMinted != noteHash || confidentialTotalBurned != noteHash) ){
//                 ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);
//                 require(status == 1, "only unspent notes can be approved");
//             }
//         } else {
//             ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);
//             require(status == 1, "only unspent notes can be approved");    
//         }       

//         // require(
//         //     noteAccess[noteHash][msg.sender] == true || noteOwner == msg.sender,
//         //     'caller does not have permission to update metaData'
//         // );

//         // TODO: this metaDataUtils library needs to be implemented. It will 
//         // extract addresses to approve from metaData
//         noteAccess[noteHash] = extractAddresses(noteHash, metaData);

//         emit UpdateNoteMetaData(noteOwner, noteHash, metaData);
//     }
// }