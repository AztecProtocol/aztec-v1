pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/NoteRegistryFactory.sol";
import "./BehaviourBase201912.sol";

/**
  * @title FactoryBase201912
  * @author AZTEC
  * @dev Deploys a BehaviourBase201912
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryBase201912 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourBase201912 behaviourContract = new BehaviourBase201912();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}