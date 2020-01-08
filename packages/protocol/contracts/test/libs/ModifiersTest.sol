pragma solidity >= 0.5.0 <0.6.0;

import "../../libs/Modifiers.sol";

/**
* @title Test contract used to test the modifiers inherited from the Modifiers contract
*/
contract ModifiersTest is Modifiers {

    /**
    * @dev Test the checkZeroAddress() modifier
    * @param testAddress - address being checked if is it the 0x0 address
    */
    function testCheckZeroAddress(address testAddress) checkZeroAddress(testAddress) public pure returns (bool) {
        return true;
    }
}
