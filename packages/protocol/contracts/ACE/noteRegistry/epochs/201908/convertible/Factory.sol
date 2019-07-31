pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/Factory.sol";
import "./Behaviour.sol";

/**
 * @title NoteRegistryFactory contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev todo
 **/
contract FactoryConvertible201908 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance() public
      onlyOwner
      returns (address)
    {
        BehaviourConvertible201908 behaviourContract = new BehaviourConvertible201908();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}