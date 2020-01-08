pragma solidity >=0.5.0 <0.6.0;

import "../../AccountRegistry/epochs/20200106/Behaviour20200106.sol";

/**
  * @title TestBehaviour
  * @author AZTEC
  * @dev Deploys a TestBehaviour
  * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract TestBehaviour is Behaviour20200106 {
    uint256 public epoch = 2;

    function newFeature() pure public returns (bool) {
        return true;
    }
}
