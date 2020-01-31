pragma solidity >=0.5.0 <0.6.0;

import "./base/ZkAssetBase.sol";

/**
 * @title ZkAsset
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a confidential asset.
 * The ownership values and transfer values are encrypted.
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAsset is ZkAssetBase {

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAssetBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        false // Can adjust supply
    ) {
    }
}
