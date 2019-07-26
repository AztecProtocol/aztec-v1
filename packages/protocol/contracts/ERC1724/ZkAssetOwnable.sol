pragma solidity >=0.5.0 <0.6.0;

import "./base/ZkAssetOwnableBase.sol";
import "../libs/ProofUtils.sol";
import "../libs/SafeMath8.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title ZkAssetOwnable
 * @author AZTEC
 * @dev A contract which inherits from ZkAsset and includes the definition
 * of the contract owner
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/

contract ZkAssetOwnable is ZkAssetOwnableBase {
    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAssetOwnableBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        false // canAdjustSupply
    ) {
    }
}
