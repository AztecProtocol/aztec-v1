pragma solidity >=0.5.0 <0.6.0;

import "../../AccountRegistry/BehaviourGSN.sol";

/**
  * @title TestBehaviour
  * @author AZTEC
  * @dev Deploys a TestBehaviour
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract TestBehaviour is BehaviourGSN {
    function newFeature() pure public returns (string memory result) {
        result = 'newFeature';
        return result;
    }
}
