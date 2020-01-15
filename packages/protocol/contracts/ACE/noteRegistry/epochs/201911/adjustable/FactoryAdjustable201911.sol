pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/NoteRegistryFactory.sol";
import "./BehaviourAdjustable201911.sol";

/**
  * @title FactoryAdjustable201911
  * @author AZTEC
  * @dev Deploys a BehaviourAdjustable201911
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryAdjustable201911 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourAdjustable201911 behaviourContract = new BehaviourAdjustable201911();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}
