pragma solidity >=0.5.0 <0.6.0;

import "@aztec/protocol/contracts/ACE/validators/joinSplit/JoinSplit.sol";
import "@aztec/protocol/contracts/ACE/validators/joinSplitFluid/JoinSplitFluid.sol";
import "@aztec/protocol/contracts/ACE/validators/swap/Swap.sol";
import "@aztec/protocol/contracts/ACE/validators/privateRange/PrivateRange.sol";
import "@aztec/protocol/contracts/ACE/validators/publicRange/PublicRange.sol";
import "@aztec/protocol/contracts/ACE/validators/dividend/Dividend.sol";
import "@aztec/protocol/contracts/ACE/noteRegistry/epochs/201907/base/FactoryBase201907.sol";
import "@aztec/protocol/contracts/ACE/noteRegistry/epochs/201907/adjustable/FactoryAdjustable201907.sol";
import "@aztec/protocol/contracts/ERC1724/ZkAssetMintable.sol";
import "@aztec/protocol/contracts/ERC1724/ZkAssetBurnable.sol";
import "@aztec/protocol/contracts/ERC1724/ZkAssetOwnable.sol";
import "@aztec/protocol/contracts/ERC1724/ZkAsset.sol";

contract Dummy {}
