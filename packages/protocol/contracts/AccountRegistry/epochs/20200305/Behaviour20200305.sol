pragma solidity >=0.5.0 <0.6.0;

import "../20200220/Behaviour20200220.sol";
import "../../../interfaces/IERC20Permit.sol";

/**
 * @title Behaviour20200305 implementation
 * @author AZTEC
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
contract Behaviour20200305 is Behaviour20200220 {
    /**
    * @dev epoch number, used for version control in upgradeability. The naming convention is based on the
    * date on which the contract was created, in the format: YYYYMMDD
    */
    uint256 public epoch = 20200305;

    /**
    * @dev Perform a confidential transfer, mediated by a smart contracrt
    * @param _proofId - uint24 proofId
    * @param _registryOwner - address of the note registry owner
    * @param _proofData - data generated from proof construction, which is used to validate the proof
    * @param _spender - address that will be spending the notes
    * @param _proofSignature - EIP712 signature used to approve/revoke permission for the proof
    * @param _proofSignature2 - EIP712 signature with be s bit flipped for replay protection of ZkDai
    * to be spent
    */
    function confidentialTransferFrom(
        uint24 _proofId,
        address _registryOwner,
        bytes memory _proofData,
        address _spender,
        bytes memory _proofSignature,
        bytes memory _proofSignature2
    ) public {

        bytes memory proofOutputs = ace.validateProof(_proofId, address(this), _proofData);

        if(_proofSignature.length != 0) {
            IZkAsset(_registryOwner).approveProof(_proofId, proofOutputs, _spender, true, _proofSignature);
        }
        if(_proofSignature2.length != 0) {
            IZkAsset(_registryOwner).approveProof(_proofId, proofOutputs, _spender, true, _proofSignature2);
        }

        IZkAsset(_registryOwner).confidentialTransferFrom(_proofId, proofOutputs.get(0));
    }
}

