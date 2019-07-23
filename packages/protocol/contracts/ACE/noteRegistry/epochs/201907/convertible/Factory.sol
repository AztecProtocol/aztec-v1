pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/Factory.sol";
import "./Behaviour.sol";

/**
 * @title NoteRegistryFactory contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev todo
 **/
contract FactoryConvertible201907 is NoteRegistryFactory {
    event NoteRegistryDeployed(address behaviourContract);

    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance() public
      onlyOwner
      returns (address)
    {
        BehaviourConvert201907 behaviourContract = new BehaviourConvert201907();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }

    function upgradeBehaviour(address _oldImplementation, address _newImplementation) public onlyOwner {
        require(ProxyAdmin(_oldImplementation).admin() == address(this), "this is not the admin of the proxy");
        ProxyAdmin(_oldImplementation).upgradeTo(_newImplementation);
    }
}
