pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/Factory.sol";
import "./Behaviour.sol";

/**
  * @title FactoryAdjustable201908
  * @author AZTEC
  * @dev Deploys a BehaviourAdjustable201908
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryAdjustable201908 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourAdjustable201908 behaviourContract = new BehaviourAdjustable201908();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}
