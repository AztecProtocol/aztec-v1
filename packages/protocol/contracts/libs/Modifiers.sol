pragma solidity >=0.5.0 <0.6.0;


contract Modifiers {
    
    /**
    * @dev Check that the input address is not 0x0, and revert if it is
    */
    modifier checkZeroAddress(address addressToCheck) {
        require(addressToCheck != address(0x0), 'address can not be 0x0');
        _;
    }
}   
