pragma solidity >=0.5.0 <0.6.0;

import "../../ACE/noteRegistry/epochs/201907/base/FactoryBase201907.sol";
import "../../Proxies/BaseAdminUpgradeabilityProxy.sol";

/**
  * @title TestFactory
  * @author AZTEC
  * @dev Deploys a TestFactory
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract TestFactory is FactoryBase201907 {
    constructor(address _aceAddress) public FactoryBase201907(_aceAddress) {}

    function getImplementation(address payable _proxyAddress) public returns (address implementation) {
        implementation = BaseAdminUpgradeabilityProxy(_proxyAddress).implementation();
    }
}
