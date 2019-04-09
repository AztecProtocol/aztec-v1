pragma solidity >=0.5.0 <0.6.0;

import "../../ERC20/ERC20Mintable.sol";

/**
 * @title ERC20BrokenTransferFromTest
 * @dev Extending ERC20 by adding some functions that always revert when called.
 */
contract ERC20BrokenTransferFromTest is ERC20Mintable {

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(true == false, "you shall not pass");
        super.transferFrom(_from, _to, _value);
        return true;
    }
}
