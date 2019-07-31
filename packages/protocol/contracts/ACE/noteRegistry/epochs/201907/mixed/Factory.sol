pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/Factory.sol";
import "./Behaviour.sol";

/**
  * @title FactoryMixed201907
  * @author AZTEC
  * @dev Deploys a BehaviourMixed201907
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryMixed201907 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance() public
      onlyOwner
      returns (address)
    {
        BehaviourMixed201907 behaviourContract = new BehaviourMixed201907();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}