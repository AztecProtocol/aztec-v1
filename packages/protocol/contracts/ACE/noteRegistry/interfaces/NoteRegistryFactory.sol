pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../../../interfaces/IAZTEC.sol";
import "./ProxyAdmin.sol";

/**
 * @title NoteRegistryFactory
 * @author AZTEC
 * @dev Interface definition for factories. Factory contracts have the responsibility of managing the full lifecycle of
 * Behaviour contracts, from deploy to eventual upgrade. They are owned by ACE, and all methods should only be callable
 * by ACE.
 **/
contract NoteRegistryFactory is IAZTEC, Ownable  {
    event NoteRegistryDeployed(address behaviourContract);

    constructor(address _aceAddress) public Ownable() {
        transferOwnership(_aceAddress);
    }

    function deployNewBehaviourInstance() public returns (address);

    function upgradeBehaviour(address _oldImplementation, address _newImplementation) public onlyOwner {
        require(ProxyAdmin(_oldImplementation).admin() == address(this), "this is not the admin of the proxy");
        ProxyAdmin(_oldImplementation).upgradeTo(_newImplementation);
    }
}
