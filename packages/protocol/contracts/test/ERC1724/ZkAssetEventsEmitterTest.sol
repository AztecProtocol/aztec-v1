pragma solidity >=0.5.0 <0.6.0;


/**
 * @title ZkAssetEventsEmitterTest
 * @author AZTEC
 * @dev Used for testing purposes
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAssetEventsEmitterTest {

    event ApprovedAddress(address indexed addressApproved, bytes32 indexed noteHash);
    event CreateNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);
    event DestroyNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);
    event UpdateNoteMetaData(address indexed owner, bytes32 indexed noteHash, bytes metadata);


    uint256 public createdNotes = 0;

    function emitCreateNote(address owner, bytes memory metadata, uint256 count) public {
        for (uint i = 0; i<count; i++) {
            createdNotes++;
            emit CreateNote(owner, bytes32(createdNotes), metadata);
        }
    }

    function emitDestroyNote(address owner, bytes memory metadata, uint256 noteIndex) public {
        require(noteIndex <= createdNotes, 'noteIndex must be less or equal to createdNotes');

        emit DestroyNote(owner, bytes32(noteIndex), metadata);
    }

    function emitUpdateNoteMetaData(address owner, bytes memory metadata, uint256 noteIndex) public {
        require(noteIndex <= createdNotes, 'noteIndex must be less or equal to createdNotes');

        emit UpdateNoteMetaData(owner, bytes32(noteIndex), metadata);
    }

}