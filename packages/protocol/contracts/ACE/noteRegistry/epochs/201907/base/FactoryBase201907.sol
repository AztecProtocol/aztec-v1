pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/NoteRegistryFactory.sol";
import "./BehaviourBase201907.sol";

/**
  * @title FactoryBase201907
  * @author AZTEC
  * @dev Deploys a BehaviourBase201907
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryBase201907 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourBase201907 behaviourContract = new BehaviourBase201907();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}