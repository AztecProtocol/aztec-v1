

pragma solidity >=0.5.0 <0.6.0;

import "./base/ZkAssetBurnableBase.sol";

/**
 * @title ZkAssetBurnable
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a confidential burnable asset.
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
**/
contract ZkAssetBurnable is ZkAssetBurnableBase {
    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAssetOwnableBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        true // canAdjustSupply
    ) {
    }
}


