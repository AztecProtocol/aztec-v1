pragma solidity >=0.5.0 <0.6.0;

import "./ZkAssetBase.sol";
import "../../libs/ProofUtils.sol";
import "../../libs/SafeMath8.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title ZkAssetOwnableBase
 * @author AZTEC
 * @dev A contract which inherits from ZkAsset and includes the definition
 * of the contract owner
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

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
    }
}
