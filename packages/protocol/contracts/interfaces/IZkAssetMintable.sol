

pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../ERC1724/ZkAsset.sol";
import "../ACE/ACE.sol";
import "../ERC20/ERC20Mintable.sol";
import "../libs/LibEIP712.sol";
import "../libs/ProofUtils.sol";
import "../ERC1724/ZkAssetOwnable.sol";

/**
 * @title IZkAssetMintable
 * @author AZTEC
 * @dev An interface defining the ZkAssetMintable standard.
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
**/

interface IZkAssetMintable {

    function confidentialMint(uint24 _proof, bytes calldata _proofData) external;

    function confidentialTransfer(bytes calldata _proofData, bytes calldata _signatures) external;
}

