pragma solidity >=0.5.0 <0.6.0;

import "../Factory.sol";
import "./Behaviour.sol";

/**
 * @title NoteRegistryFactory contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev todo
 **/
contract FactoryMixed201907 is Factory201907 {
    constructor(address _aceAddress) public Factory201907(_aceAddress) {}

    function deployNewBehaviourInstance() public
      onlyOwner
      returns (address)
    {
        BehaviourMixed201907 behaviourContract = new BehaviourMixed201907();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}