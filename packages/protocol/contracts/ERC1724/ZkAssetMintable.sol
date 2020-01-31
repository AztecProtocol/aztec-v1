

pragma solidity >=0.5.0 <0.6.0;

import "./base/ZkAssetMintableBase.sol";

/**
 * @title ZkAssetMintable
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a mintable confidential asset.
 * The ownership values and transfer values are encrypted.
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
**/
contract ZkAssetMintable is ZkAssetMintableBase {
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

