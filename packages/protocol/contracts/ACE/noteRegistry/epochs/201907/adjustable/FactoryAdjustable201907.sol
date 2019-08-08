pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/NoteRegistryFactory.sol";
import "./BehaviourAdjustable201907.sol";

/**
  * @title FactoryAdjustable201907
  * @author AZTEC
  * @dev Deploys a BehaviourAdjustable201907
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryAdjustable201907 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourAdjustable201907 behaviourContract = new BehaviourAdjustable201907();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}
