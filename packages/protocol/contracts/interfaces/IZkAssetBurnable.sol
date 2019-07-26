

pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../ERC1724/ZkAsset.sol";
import "../ACE/ACE.sol";
import "../libs/LibEIP712.sol";
import "../libs/ProofUtils.sol";
import "../ERC1724/ZkAssetOwnable.sol";

/**
 * @title IZkAssetBurnable
 * @author AZTEC
 * @dev A standard defining the ZkAssetBurnable interfac e
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
**/

interface IZkAssetBurnable {
    function confidentialBurn(uint24 _proof, bytes calldata _proofData) external;
}


