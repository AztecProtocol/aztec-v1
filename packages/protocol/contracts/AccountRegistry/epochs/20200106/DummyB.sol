pragma solidity >=0.5.0 <0.6.0;

contract DummyB {
    uint256 public stateB;

    function initialize(uint256 dummyState) public {
        stateB = dummyState;
    }
}
