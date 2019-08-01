

pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../../ACE/ACE.sol";
import "../../ERC20/ERC20Mintable.sol";
import "../../libs/LibEIP712.sol";
import "../../libs/ProofUtils.sol";
import "./ZkAssetOwnableBase.sol";

/**
 * @title ZkAssetMintable
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a mintable confidential asset.
 * The ownership values and transfer values are encrypted.
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
**/
contract ZkAssetMintableBase is ZkAssetOwnableBase {
    event UpdateTotalMinted(bytes32 noteHash, bytes noteData);

    /**
    * @dev Executes a confidential minting procedure, dependent on the provided proofData
    * being succesfully validated by the zero-knowledge validator
    *
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofData - bytes array of proof data, outputted from a proof construction
    */
    function confidentialMint(uint24 _proof, bytes calldata _proofData) external onlyOwner {
        require(_proofData.length != 0, "proof invalid");

        (bytes memory _proofOutputs) = ace.mint(_proof, _proofData, address(this));

        (, bytes memory newTotal, ,) = _proofOutputs.get(0).extractProofOutput();

        (, bytes memory mintedNotes, ,) = _proofOutputs.get(1).extractProofOutput();

        (,
        bytes32 noteHash,
        bytes memory metadata) = newTotal.get(0).extractNote();

        logOutputNotes(mintedNotes);
        emit UpdateTotalMinted(noteHash, metadata);
    }
    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes adapted for use with
    * a mintable ZkAsset.
    *
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * If public value is being transferred out of the ACE, and the minted value is greater than
    * ACE's token balance, then tokens will be minted from the linked ERC20 token using supplementTokens()
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofData bytes variable outputted from proof construction
    * @param _signatures ECDSA signatures over all input notes involved in the confidentialTransfer()
    */
    function confidentialTransfer(bytes memory _proofData, bytes memory _signatures) public {
        bytes memory proofOutputs = ace.validateProof(JOIN_SPLIT_PROOF, msg.sender, _proofData);
        require(proofOutputs.length != 0, "proof invalid");

        bytes memory proofOutput = proofOutputs.get(0);

        (,
        ,
        ,
        int256 publicValue) = proofOutput.extractProofOutput();

        (
            ,
            uint256 scalingFactor,
            uint256 totalSupply,
            ,
            ,
            ,
        ) = ace.getRegistry(address(this));
        if (publicValue > 0) {
            if (totalSupply < uint256(publicValue)) {
                uint256 supplementValue = uint256(publicValue).sub(totalSupply);
                ERC20Mintable(address(linkedToken)).mint(address(this), supplementValue.mul(scalingFactor));
                ERC20Mintable(address(linkedToken)).approve(address(ace), supplementValue.mul(scalingFactor));

                ace.supplementTokens(supplementValue);
            }
        }

        confidentialTransferInternal(proofOutputs, _signatures, _proofData);
    }

    /**
    * @dev Executes a value transfer mediated by smart contracts. The method is supplied with
    * transfer instructions represented by a bytes _proofOutput argument that was outputted
    * from a proof verification contract. Adapted for use with a mintable ZkAsset.

    * If public value is being transferred out of the ACE, and the minted value is greater than
    * ACE's token balance, then tokens will be minted from the linked ERC20 token using supplementTokens()
    * 
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofOutput - output of a zero-knowledge proof validation contract. Represents
    * transfer instructions for the ACE
    */
    function confidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();
        
        uint256 length = inputNotes.getLength();
        for (uint i = 0; i < length; i += 1) {
            (, bytes32 noteHash, ) = inputNotes.get(i).extractNote();
            require(
                confidentialApproved[noteHash][msg.sender] == true,
                "sender does not have approval to spend input note"
            );
        }

        (
            ,
            uint256 scalingFactor,
            uint256 totalSupply,
            ,
            ,
            ,
        ) = ace.getRegistry(address(this));

        if (publicValue > 0) {
            if (totalSupply < uint256(publicValue)) {
                uint256 supplementValue = uint256(publicValue).sub(totalSupply);
                ERC20Mintable(address(linkedToken)).mint(address(this), supplementValue.mul(scalingFactor));
                ERC20Mintable(address(linkedToken)).approve(address(ace), supplementValue.mul(scalingFactor));

                ace.supplementTokens(supplementValue);
            }
        }


        ace.updateNoteRegistry(_proof, _proofOutput, msg.sender);

        logInputNotes(inputNotes);
        logOutputNotes(outputNotes);

        if (publicValue < 0) {
            emit ConvertTokens(publicOwner, uint256(-publicValue));
        }
        if (publicValue > 0) {
            emit RedeemTokens(publicOwner, uint256(publicValue));
        }
    }
}

