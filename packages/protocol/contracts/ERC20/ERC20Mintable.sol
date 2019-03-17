pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20Mintable
 * @dev ERC20 minting logic
 * Sourced from OpenZeppelin and thoroughly butchered to remove security guards.
 * Anybody can adjustSupply - STRICTLY FOR TEST PURPOSES
 */
contract ERC20Mintable is ERC20 {
    /**
    * @dev Function to adjustSupply tokens
    * @param _to The address that will receive the minted tokens.
    * @param _value The amount of tokens to adjustSupply.
    * @return A boolean that indicates if the operation was successful.
    */
    function adjustSupply(address _to, uint256 _value) public returns (bool) {
        _mint(_to, _value);
        return true;
    }
}
