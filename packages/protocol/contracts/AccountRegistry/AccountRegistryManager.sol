pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./interfaces/IAccountRegistryBehaviour.sol";
import "../Proxies/AdminUpgradeabilityProxy.sol";
import "../Proxies/BaseAdminUpgradeabilityProxy.sol";
import "../interfaces/ProxyAdmin.sol";

/**
 * @title AccountRegistryManager
 * @author AZTEC
 * @dev Manager contract that manages the deployment of proxy contracts and upgrading
 * of account registries
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 */
contract AccountRegistryManager is Ownable {
    using SafeMath for uint256;

    IAccountRegistryBehaviour public behaviour;
    address public accountRegistry;
    address public proxy;
    uint256 public latestEpoch = 0;

    event CreateProxy(address proxyAddress, address proxyAdmin);
    event IncrementLatestEpoch(uint256 newLatestEpoch);
    event UpgradeAccountRegistry(address proxyAddress, address newBehaviourAddress);

    /**
     * @dev Deploy the proxy contract. This stores all state for the AccountRegistry contract system
     */
    function deployProxy(address initialBehaviourAddress, address _aceAddress, address _trustedAddress) public onlyOwner {
        require(initialBehaviourAddress != address(0x0), 'behaviour address can not be 0x0');

        bytes memory initialiseData = abi.encodeWithSignature(
            "initialize(address,address)",
            _aceAddress,
            _trustedAddress
        );
        address admin = address(this);

        address proxyAddress = address(new AdminUpgradeabilityProxy(
            initialBehaviourAddress,
            admin,
            initialiseData 
        ));
    
        proxy = proxyAddress;
        behaviour = IAccountRegistryBehaviour(proxyAddress);
        accountRegistry = initialBehaviourAddress;

        incrementLatestEpoch();
        emit CreateProxy(proxyAddress, admin);
    }
    

    /**
     * @dev Get the current behaviour contract address
     */
    function getImplementation(address payable _proxyAddress) public returns (address implementation) {
        implementation = BaseAdminUpgradeabilityProxy(_proxyAddress).implementation();
    }

    /**
     * @dev Increment the `latestEpoch` storage variable.
     */
    function incrementLatestEpoch() internal {
        latestEpoch = latestEpoch.add(1);
        emit IncrementLatestEpoch(latestEpoch);
    }

    /**
     * @dev Upgrade the account registry to a new behaviour implementation
    */
    function upgradeAccountRegistry(address proxyAddress, address newBehaviourAddress) public onlyOwner {
        require(newBehaviourAddress != address(0x0), 'new behaviour address can not be 0x0');
        require(proxyAddress != address(0x0), 'proxyAddress can not be 0x0');
        require(ProxyAdmin(proxyAddress).admin() == address(this), 'this is not the admin of the proxy');
        
        uint256 newBehaviourEpoch = IAccountRegistryBehaviour(newBehaviourAddress).epoch();
        require(newBehaviourEpoch >= latestEpoch, 'expected new registry to be of epoch equal or greater than existing registry');

        ProxyAdmin(proxyAddress).upgradeTo(newBehaviourAddress);
        incrementLatestEpoch();
        
        accountRegistry = newBehaviourAddress;
        emit UpgradeAccountRegistry(proxyAddress, newBehaviourAddress);
    }
}
