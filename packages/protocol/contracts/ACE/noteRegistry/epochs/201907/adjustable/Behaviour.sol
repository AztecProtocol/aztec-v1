pragma solidity >=0.5.0 <0.6.0;

import "../../../../../interfaces/IAZTEC.sol";
import "../../../../../libs/NoteUtils.sol";
import "../Behaviour.sol";

/**
 * @title NoteRegistryBehaviour contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev TODO
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract BehaviourAdjustable201907 is Behaviour201907 {
    constructor () Behaviour201907() public {}

    /**
    * @dev Burn AZTEC notes
    * TODO
    */
    function burn(bytes calldata _proofOutputs) external onlyOwner {
        require(registry.canAdjustSupply == true, "this asset is not burnable");
        // Dealing with notes representing totals
        (bytes memory oldTotal, // input notes
        bytes memory newTotal, // output notes
        ,
        ) = _proofOutputs.get(0).extractProofOutput();

        // Dealing with burned notes
        (,
        bytes memory burnedNotes,
        ,) = _proofOutputs.get(1).extractProofOutput();

        (, bytes32 oldTotalNoteHash, ) = oldTotal.get(0).extractNote();
        require(oldTotalNoteHash == registry.confidentialTotalBurned, "provided total burned note does not match");
        (, bytes32 newTotalNoteHash, ) = newTotal.get(0).extractNote();
        setConfidentialTotalBurned(newTotalNoteHash);

        // Although they are outputNotes, they are due to be destroyed - need removing from the note registry
        updateInputNotes(burnedNotes);
    }

        /**
    * @dev Mint AZTEC notes
    * TODO
    */
    function mint(bytes calldata _proofOutputs) external onlyOwner {
        require(registry.canAdjustSupply == true, "this asset is not mintable");
        // Dealing with notes representing totals
        (bytes memory oldTotal, // input notes
        bytes memory newTotal, // output notes
        ,
        ) = _proofOutputs.get(0).extractProofOutput();

        // Dealing with burned notes
        (,
        bytes memory mintedNotes,
        ,) = _proofOutputs.get(1).extractProofOutput();

        (, bytes32 oldTotalNoteHash, ) = oldTotal.get(0).extractNote();
        require(oldTotalNoteHash == registry.confidentialTotalMinted, "provided total burned note does not match");
        (, bytes32 newTotalNoteHash, ) = newTotal.get(0).extractNote();
        setConfidentialTotalMinted(newTotalNoteHash);

        updateOutputNotes(mintedNotes);
    }

    /**
        * @dev Update the state of the note registry according to transfer instructions issued by a 
        * zero-knowledge proof
        *
        * @param _proof - unique identifier for a proof
        * @param _proofOutput - transfer instructions issued by a zero-knowledge proof
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public onlyOwner {
        require(registry.active == true, "note registry does not exist for the given address");

        (bytes memory inputNotes,
        bytes memory outputNotes,
        ,
        int256 publicValue) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);

        // If publicValue != 0, enact a token transfer
        // (publicValue < 0) => transfer from publicOwner to ACE
        // (publicValue > 0) => transfer from ACE to publicOwner
        if (publicValue != 0) {
            require(registry.canConvert == true, "asset cannot be converted into public tokens");
        }
    }

    function setConfidentialTotalMinted(bytes32 newTotalNoteHash) internal onlyOwner returns (bytes32) {
        registry.confidentialTotalMinted = newTotalNoteHash;
        return newTotalNoteHash;
    }

    function setConfidentialTotalBurned(bytes32 newTotalNoteHash) internal onlyOwner returns (bytes32) {
        registry.confidentialTotalBurned = newTotalNoteHash;
        return newTotalNoteHash;
    }
}
