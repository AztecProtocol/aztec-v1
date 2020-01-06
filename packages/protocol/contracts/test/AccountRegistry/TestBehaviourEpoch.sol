pragma solidity >=0.5.0 <0.6.0;

import "../../AccountRegistry/epochs/20200106/Behaviour20200106.sol";

/**
  * @title TestBehaviourEpoch
  * @author AZTEC
  * @dev Deploys a TestBehaviourEpoch. This deliberately has an incorrect epoch number - 1, rather than the 
  * correct value of 2. This is done to assist testing of the account registry versioning system.
  *
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract TestBehaviourEpoch is Behaviour20200106 {
    uint256 public epoch = 0;

    function newFeature() pure public returns (string memory result) {
        result = 'newFeature';
        return result;
    }
}
