pragma solidity >=0.5.0 <0.6.0;

import "../../ACE/noteRegistry/epochs/201907/convertible/FactoryConvertible201907.sol";
import "../../ACE/noteRegistry/proxies/BaseAdminUpgradeabilityProxy.sol";

/**
  * @title FactoryConvertible201907
  * @author AZTEC
  * @dev Deploys a BehaviourConvertible201907
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract TestFactory is FactoryConvertible201907 {
    constructor(address _aceAddress) public FactoryConvertible201907(_aceAddress) {}

    function getImplementation(address payable _proxyAddress) public returns (address implementation) {
        implementation = BaseAdminUpgradeabilityProxy(_proxyAddress).implementation();
    }
}