pragma solidity >=0.5.0 <0.6.0;

import "../libs/SafeMath8.sol";

contract SafeMath8Test {
    using SafeMath8 for uint8;

    function _mul(uint8 a, uint8 b) public pure returns (uint8) {
        return(a.mul(b));
    }

    function _add(uint8 a, uint8 b) public pure returns (uint8) {
        return(a.add(b));
    }

    function _sub(uint8 a, uint8 b) public pure returns (uint8) {
        return(a.sub(b));
    }
}