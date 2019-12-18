pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IAccountRegistryBehaviour.sol";
import "../Proxies/AdminUpgradeabilityProxy.sol";
import "../Proxies/BaseAdminUpgradeabilityProxy.sol";
import "../interfaces/ProxyAdmin.sol";

/**
 * @title AccountRegistryManager
 * @author AZTEC
 * @dev 
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 */
contract AccountRegistryManager is Ownable {

    IAccountRegistryBehaviour public behaviour;
    address public accountRegistry;
    address public proxy;

    event CreateProxy(address proxyAddress, address proxyAdmin);
    event UpgradeAccountRegistry(address proxyAddress, address newBehaviourAddress);

    /**
     * @dev Deploy the proxy contract. This stores all state for the AccountRegistry contract system
     *
     */
    function deployProxy(address initialBehaviourAddress) public onlyOwner {
        require(initialBehaviourAddress != address(0x0), 'behaviour address can not be 0x0');

        bytes memory emptyDataToSkipInitialisation = bytes('');
        address admin = address(this);

        address proxyAddress = address(new AdminUpgradeabilityProxy(
            initialBehaviourAddress,
            admin,
            emptyDataToSkipInitialisation
        ));
    
        proxy = proxyAddress;
        behaviour = IAccountRegistryBehaviour(proxyAddress);
        accountRegistry = initialBehaviourAddress;

        emit CreateProxy(proxyAddress, admin);
    }
    

    /**
     * @dev Get the current behaviour contract address
     */
    function getImplementation(address payable _proxyAddress) public returns (address implementation) {
        implementation = BaseAdminUpgradeabilityProxy(_proxyAddress).implementation();
    }

    /**
     * @dev Upgrade the account registry to a new behaviour implementation
    */
    function upgradeAccountRegistry(address proxyAddress, address newBehaviourAddress) public onlyOwner {
        require(newBehaviourAddress != address(0x0), 'new behaviour address can not be 0x0');
        require(proxyAddress != address(0x0), 'proxyAddress can not be 0x0');
        require(ProxyAdmin(proxyAddress).admin() == address(this), 'this is not the admin of the proxy');

        ProxyAdmin(proxyAddress).upgradeTo(newBehaviourAddress);
        
        accountRegistry = newBehaviourAddress;
        emit UpgradeAccountRegistry(proxyAddress, newBehaviourAddress);
    }
}
