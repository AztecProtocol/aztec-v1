pragma solidity >=0.5.0 <0.6.0;

interface IAccountRegistryManager {

    function deployProxy(address initialBehaviourAddress) external;

    function upgradeAccountRegistry() external;
    
    event CreateProxy(address proxyAddress, address adminAddress);
    
    event UpgradeAccountRegistry(address proxyAddress, address newBehaviourAddress);
}
