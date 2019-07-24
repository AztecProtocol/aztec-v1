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
contract BehaviourConvertible201907 is Behaviour201907 {
    constructor () Behaviour201907() public {}

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
        bytes32 proofHash = keccak256(_proofOutput);

        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);

        // If publicValue != 0, enact a token transfer
        // (publicValue < 0) => transfer from publicOwner to ACE
        // (publicValue > 0) => transfer from ACE to publicOwner
        if (publicValue != 0) {
            require(registry.canConvert == true, "asset cannot be converted into public tokens");

            if (publicValue < 0) {
                uint256 approvalForAddressForHash = registry.publicApprovals[publicOwner][proofHash];
                registry.totalSupply = registry.totalSupply.add(uint256(-publicValue));
                require(
                    approvalForAddressForHash >= uint256(-publicValue),
                    "public owner has not validated a transfer of tokens"
                );

                registry.publicApprovals[publicOwner][proofHash] = approvalForAddressForHash.sub(uint256(-publicValue));
                NoteRegistryManager(owner()).transferFrom(
                    publicOwner,
                    address(owner()),
                    uint256(-publicValue).mul(registry.scalingFactor));
            } else {
                registry.totalSupply = registry.totalSupply.sub(uint256(publicValue));
                NoteRegistryManager(owner()).transferFrom(
                    address(owner()),
                    publicOwner,
                    uint256(publicValue).mul(registry.scalingFactor));
            }
        }
    }

    /**
    * @dev This should be called from an asset contract.
    */
    function publicApprove(address _publicOwner, bytes32 _proofHash, uint256 _value) public onlyOwner {
        registry.publicApprovals[_publicOwner][_proofHash] = _value;
    }

    function setConfidentialTotalMinted(bytes32 newTotalNoteHash) internal onlyOwner returns (bytes32) {
        require(registry.canAdjustSupply == true, "this asset is not mintable");
        return ZERO_VALUE_NOTE_HASH;
    }

    function setConfidentialTotalBurned(bytes32 newTotalNoteHash) internal onlyOwner returns (bytes32) {
        require(registry.canAdjustSupply == true, "this asset is not burnable");
        return ZERO_VALUE_NOTE_HASH;
    }
}
