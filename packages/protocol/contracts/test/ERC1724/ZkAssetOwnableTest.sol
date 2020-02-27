pragma solidity >=0.5.0 <0.6.0;

import "../../ERC1724/ZkAssetOwnable.sol";
import "../../libs/NoteUtils.sol";

/**
 * @title ZkAssetOwnableTest
 * @author AZTEC
 * @dev Used for testing purposes
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
contract ZkAssetOwnableTest {
    using NoteUtils for bytes;

    ZkAssetOwnable public zkAssetOwnable;

    function setZkAssetOwnableAddress(address _zkAssetOwnableAddress) public {
        zkAssetOwnable = ZkAssetOwnable(_zkAssetOwnableAddress);
    }

    function callValidateProof(uint24 _proof, bytes memory _proofData) public {
        zkAssetOwnable.ace().validateProof(_proof, msg.sender, _proofData);
    }

    function callConfidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        // throws if no approval has been given
        zkAssetOwnable.confidentialTransferFrom(_proof, _proofOutput);
    }

    function callApproveAndTransferFrom(uint24 _proof, bytes memory _proofData) public {
        bytes memory proofOutputs = zkAssetOwnable.ace().validateProof(_proof, msg.sender, _proofData);

        for (uint i = 0; i < proofOutputs.getLength(); i += 1) {
            bytes memory proofOutput = proofOutputs.get(i);

            (bytes memory inputNotes,,,) = proofOutput.extractProofOutput();
            for (uint256 j = 0; j < inputNotes.getLength(); j += 1) {
                (, bytes32 noteHash, ) = inputNotes.get(j).extractNote();
                zkAssetOwnable.confidentialApprove(noteHash, address(this), true, '');
            }
            callConfidentialTransferFrom(_proof, proofOutput);
        }
    }

    function callApproveProof(
        uint24 _proofId,
        bytes memory _proofOutputs,
        address _spender,
        bool _approval,
        bytes memory _proofSignature
    ) public {
        zkAssetOwnable.approveProof(_proofId, _proofOutputs, _spender, _approval, _proofSignature);
    }
}
