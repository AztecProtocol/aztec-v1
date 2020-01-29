pragma solidity >=0.5.0 <0.6.0;

contract IAccountRegistryManager {
    address payable public proxyAddress;
    uint256 public latestEpoch;

    function getImplementation() external;

    function deployProxy(address initialBehaviourAddress) external;

    function upgradeAccountRegistry(address newBehaviourAddress) external;
    
    event CreateProxy(address indexed proxyAddress, address indexed proxyAdmin);

    event UpdateLatestEpoch(uint256 newLatestEpoch);

    event UpgradeAccountRegistry(address indexed proxyAddress, address indexed newBehaviourAddress);
}
