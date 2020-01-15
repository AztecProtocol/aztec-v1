pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/NoteRegistryFactory.sol";
import "./BehaviourBase201911.sol";

/**
  * @title FactoryBase201911
  * @author AZTEC
  * @dev Deploys a BehaviourBase201911
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryBase201911 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourBase201911 behaviourContract = new BehaviourBase201911();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}