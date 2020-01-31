pragma solidity >=0.5.0 <0.6.0;

import "./base/ZkAssetMintableBase.sol";
import "./base/ZkAssetBurnableBase.sol";

/**
 * @title ZkAssetAdjustable
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
 * along with this program.  If not, see <https://www.gnu.org/licenses/>
**/
contract ZkAssetAdjustable is ZkAssetMintableBase, ZkAssetBurnableBase {
    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        uint24 _optionalMintProofId,
        bytes memory _optionalInitialisationMint
    ) public ZkAssetOwnableBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        true // canAdjustSupply
    ) {
        if (_optionalMintProofId != 0 && _optionalInitialisationMint.length != 0) {
            confidentialMint(_optionalMintProofId, _optionalInitialisationMint);
        }
    }
}

