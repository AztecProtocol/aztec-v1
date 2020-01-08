pragma solidity >=0.5.0 <0.6.0;

contract DummyA {
    uint256 public stateA;

    function initialize(uint256 dummyState) public {
        stateA = dummyState;
    }
}
