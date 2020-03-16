pragma solidity >=0.5.0 <0.6.0;

import "./ZkAssetBase.sol";
import "../../libs/ProofUtils.sol";
import "../../libs/SafeMath8.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title ZkAssetOwnableBase
 * @author AZTEC
 * @dev A contract which inherits from ZkAsset and includes the definition
 * of the contract owner
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
 * along with this program.  If not, see <https://www.gnu.org/licenses/>. **/

contract ZkAssetOwnableBase is ZkAssetBase, Ownable {
    using ProofUtils for uint24;
    using SafeMath8 for uint8;

    mapping(uint8 => uint256) public proofs;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply
    ) public ZkAssetBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        _canAdjustSupply
    ) {
        // register the basic joinSplit as a valid proof
        // 16 + 1, recall that 1 is the join-split validator because of 1 * 256**(0)
        proofs[ace.latestEpoch()] = 17;
    }

    /**
    * @dev Set which proofs this asset is able to listen to and validate
    * @param _epoch  epoch number to which the proof belongs
    * @param _proofs proofs for which the asset will listen to
    */
    function setProofs(
        uint8 _epoch,
        uint256 _proofs
    ) external onlyOwner {
        proofs[_epoch] = _proofs;
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
        super.confidentialTransfer(_proofId, _proofData, _signatures);
    }

    /**
    * @dev Executes a value transfer mediated by smart contracts. The method is supplied with
    * transfer instructions represented by a bytes _proofOutput argument that was outputted
    * from a proof verification contract.
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
        super.confidentialTransferFrom(_proofId, _proofOutput);
    }

    /**
    * @dev Return whether the proof is supported or not by this asset. Note that we have
    *     to subtract 1 from the proof id because the original representation is uint8,
    *     but here that id is considered to be an exponent
    *
    * @param _proof - unique identifier specifying the proof to be checked as to whether it is
    *                 supported by the asset
    * @return boolean defining whether the asset supports the proof specified by _proof input
    */
    function supportsProof(uint24 _proof) public view returns (bool) {
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        require(category == uint8(ProofCategory.BALANCED), "this asset only supports balanced proofs");
        uint8 bit = uint8(proofs[epoch] >> (id.sub(1)) & 1);
        return bit == 1;
    }

    /**
    * @dev Upgrade the note registry of this asset, by pointing it to a new factory
    *
    * @param _factoryId - the ID of the factory which will supply the upgraded behaviour contracts
    */
    function upgradeRegistryVersion(uint24 _factoryId) public onlyOwner {
        ace.upgradeNoteRegistry(_factoryId);
    }
}
