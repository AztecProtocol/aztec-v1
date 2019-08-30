pragma solidity ^0.5.0;

/**
 * @title BehaviourWithConflictTest
 * @author AZTEC
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract BehaviourWithConflictTest {
    event ReachedBehaviour();

    /**
        * @return The address of the proxy admin.
    */
    function admin() external returns (address) {
        emit ReachedBehaviour();
        return address(0x0);
    }
}