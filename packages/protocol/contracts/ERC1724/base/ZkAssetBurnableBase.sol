

pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../../ACE/ACE.sol";
import "../../libs/LibEIP712.sol";
import "../../libs/ProofUtils.sol";
import "./ZkAssetOwnableBase.sol";

/**
 * @title ZkAssetBurnable
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a confidential burnable asset.
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
**/
contract ZkAssetBurnableBase is ZkAssetOwnableBase {
    event UpdateTotalBurned(bytes32 noteHash, bytes noteData);

    /**
    * @dev Executes a confidential burning procedure, dependent on the provided proofData
    * being succesfully validated by the zero-knowledge validator
    *
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofData - bytes array of proof data, outputted from a proof construction
    */
    function confidentialBurn(uint24 _proof, bytes calldata _proofData) external onlyOwner {
        require(_proofData.length != 0, "proof invalid");

        (bytes memory _proofOutputs) = ace.burn(_proof, _proofData, address(this));

        (, bytes memory newTotal, ,) = _proofOutputs.get(0).extractProofOutput();

        (, bytes memory burnedNotes, ,) = _proofOutputs.get(1).extractProofOutput();

        (,
        bytes32 noteHash,
        bytes memory metadata) = newTotal.get(0).extractNote();

        logOutputNotes(burnedNotes);
        emit UpdateTotalBurned(noteHash, metadata);
    }
}


