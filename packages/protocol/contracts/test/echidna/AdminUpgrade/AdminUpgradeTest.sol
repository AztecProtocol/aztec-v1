pragma solidity ^0.5.0;

import './AdminUpgradeabilityProxy.sol';

contract AdminUpgradeTest is AdminUpgradeabilityProxy {
  constructor() AdminUpgradeabilityProxy(address(this), address(this), "") public {
  }

  function echidna_admin() public returns (bool) {
    return _admin() != address(0);
  }
}
