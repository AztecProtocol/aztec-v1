

pragma solidity >=0.5.0 <0.6.0;

import "../../ERC20/ERC20Mintable.sol";
import "./ZkAssetOwnableBase.sol";

/**
 * @title ZkAssetMintable
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a mintable confidential asset.
 * The ownership values and transfer values are encrypted.
 *
 * Copyright 2020 Spilsbury Holdings Ltd 
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/
contract ZkAssetMintableBase is ZkAssetOwnableBase {
    event UpdateTotalMinted(bytes32 noteHash, bytes metaData);

    /**
    * @dev Executes a confidential minting procedure, dependent on the provided proofData
    * being succesfully validated by the zero-knowledge validator
    *
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofData - bytes array of proof data, outputted from a proof construction
    */
    function confidentialMint(uint24 _proof, bytes memory _proofData)
        public
        onlyOwner
    {
        require(_proofData.length != 0, "proof invalid");

        (bytes memory _proofOutputs) = ace.mint(_proof, _proofData, owner());

        (, bytes memory newTotal, ,) = _proofOutputs.get(0).extractProofOutput();

        (, bytes memory mintedNotes, ,) = _proofOutputs.get(1).extractProofOutput();

        (,
        bytes32 noteHash,
        bytes memory metaData) = newTotal.get(0).extractNote();

        logOutputNotes(mintedNotes);
        emit UpdateTotalMinted(noteHash, metaData);
    }

    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofId - id of proof to be validated. Needs to be a balanced proof.
    * @param _proofData - bytes variable outputted from a proof verification contract, representing
    * transfer instructions for the ACE
    * @param _signatures - array of the ECDSA signatures over all inputNotes
    */
    function confidentialTransfer(uint24 _proofId, bytes memory _proofData, bytes memory _signatures) public {
        bool result = supportsProof(_proofId);
        require(result == true, "expected proof to be supported");
        // Check that it's a balanced proof
        (, uint8 category, ) = _proofId.getProofComponents();

        require(category == uint8(ProofCategory.BALANCED), "this is not a balanced proof");
        bytes memory proofOutputs = ace.validateProof(JOIN_SPLIT_PROOF, msg.sender, _proofData);
        require(proofOutputs.length != 0, "proof invalid");

        bytes memory proofOutput = proofOutputs.get(0);

        (,
        ,
        ,
        int256 publicValue) = proofOutput.extractProofOutput();

        if (publicValue > 0) {
            supplementTokens(uint256(publicValue));
        }

        confidentialTransferInternal(JOIN_SPLIT_PROOF, proofOutputs, _signatures, _proofData);
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
        confidentialTransfer(JOIN_SPLIT_PROOF, _proofData, _signatures);
    }

    /**
    * @dev Executes a value transfer mediated by smart contracts. The method is supplied with
    * transfer instructions represented by a bytes _proofOutput argument that was outputted
    * from a proof verification contract. Adapted for use with a mintable ZkAsset.

    * If public value is being transferred out of the ACE, and the minted value is greater than
    * ACE's token balance, then tokens will be minted from the linked ERC20 token using supplementTokens()
    *
    * @param _proofId - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofOutput - output of a zero-knowledge proof validation contract. Represents
    * transfer instructions for the ACE
    */
    function confidentialTransferFrom(uint24 _proofId, bytes memory _proofOutput) public {
        bool result = supportsProof(_proofId);
        require(result == true, "expected proof to be supported");

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

        if (publicValue > 0) {
            supplementTokens(uint256(publicValue));
        }


        ace.updateNoteRegistry(_proofId, _proofOutput, msg.sender);

        logInputNotes(inputNotes);
        logOutputNotes(outputNotes);

        if (publicValue < 0) {
            emit ConvertTokens(publicOwner, uint256(-publicValue));
        }
        if (publicValue > 0) {
            emit RedeemTokens(publicOwner, uint256(publicValue));
        }
    }

    /**
    * @dev called when a mintable and convertible asset wants to perform an
            action which puts the zero-knowledge and public
            balance out of balance. For example, if minting in zero-knowledge, some
            public tokens need to be added to the pool
            managed by ACE, otherwise any private->public conversion runs the risk of not
            having any public tokens to send.
    *
    * @param _value the value to be added
    */
    function supplementTokens(uint256 _value) internal {
        (
            ,
            uint256 scalingFactor,
            ,
            ,
            uint256 totalSupply,
            ,
            ,
        ) = ace.getRegistry(address(this));

        if (totalSupply < _value) {
            uint256 supplementValue = _value.sub(totalSupply);
            ERC20Mintable(address(linkedToken)).mint(address(this), supplementValue.mul(scalingFactor));
            ERC20Mintable(address(linkedToken)).approve(address(ace), supplementValue.mul(scalingFactor));

            ace.supplementTokens(supplementValue);
        }
    }
}

