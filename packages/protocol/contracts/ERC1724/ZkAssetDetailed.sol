pragma solidity >=0.5.0 <0.6.0;

import "./base/ZkAssetBase.sol";

/**
 * @title ZkAssetDetailed implementation that inherits from ZkAsset
 * @author AZTEC 
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAssetDetailed is ZkAssetBase {

    string public name;
    string public symbol;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        string memory _name,
        string memory _symbol
    ) public ZkAssetBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        false // canAdjustSupply
    ) {
        name = _name;
        symbol = _symbol;
    }
}
