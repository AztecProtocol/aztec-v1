pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/NoteRegistryFactory.sol";
import "./BehaviourConvertible201907.sol";

/**
  * @title FactoryConvertible201907
  * @author AZTEC
  * @dev Deploys a BehaviourConvertible201907
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract FactoryConvertible201907 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourConvertible201907 behaviourContract = new BehaviourConvertible201907();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}