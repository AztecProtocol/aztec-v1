pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/Factory.sol";
import "./Behaviour.sol";

/**
  * @title FactoryMixed201908
  * @author AZTEC
  * @dev Deploys a BehaviourMixed201908
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryMixed201908 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance() public
      onlyOwner
      returns (address)
    {
        BehaviourMixed201908 behaviourContract = new BehaviourMixed201908();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}