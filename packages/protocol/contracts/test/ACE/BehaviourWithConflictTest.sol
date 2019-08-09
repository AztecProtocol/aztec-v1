pragma solidity ^0.5.0;

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