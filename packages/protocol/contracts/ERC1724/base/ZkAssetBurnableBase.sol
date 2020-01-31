

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

        (bytes memory _proofOutputs) = ace.burn(_proof, _proofData, owner());

        (, bytes memory newTotal, ,) = _proofOutputs.get(0).extractProofOutput();

        (, bytes memory burnedNotes, ,) = _proofOutputs.get(1).extractProofOutput();

        (,
        bytes32 noteHash,
        bytes memory metadata) = newTotal.get(0).extractNote();

        logInputNotes(burnedNotes);
        emit UpdateTotalBurned(noteHash, metadata);
    }
}


