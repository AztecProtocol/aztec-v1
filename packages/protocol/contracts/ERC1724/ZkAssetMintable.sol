

pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../ACE/ACE.sol";
import "../ERC20/ERC20Mintable.sol";
import "../libs/LibEIP712.sol";
import "../libs/ProofUtils.sol";
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
        uint256 _scalingFactor
    ) public ZkAssetOwnableBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        true // canAdjustSupply
    ) {
    }
}

