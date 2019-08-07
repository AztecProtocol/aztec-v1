pragma solidity >=0.5.0 <0.6.0;

import "../../../../../interfaces/IAZTEC.sol";
import "../../../../../libs/NoteUtils.sol";
import "../Behaviour.sol";

/**
 * @title BehaviourConvertible201907
 * @author AZTEC
 * @dev This contract extends Behaviour201907, to add methods which enable public/private conversion.
        Methods are documented in interface.
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract BehaviourConvertible201907 is Behaviour201907 {
    constructor () Behaviour201907() public {}

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

    function publicApprove(address _publicOwner, bytes32 _proofHash, uint256 _value) public onlyOwner {
        registry.publicApprovals[_publicOwner][_proofHash] = _value;
    }
}
