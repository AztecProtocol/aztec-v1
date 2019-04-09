pragma solidity >=0.5.0 <0.6.0;

import "../../ERC20/ERC20Mintable.sol";

/**
 * @title ERC20BrokenTransferTest
 * @dev Extending ERC20 by adding some functions that always revert when called.
 */
contract ERC20BrokenTransferTest is ERC20Mintable {

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(true == false, "you shall not pass");
        super.transfer(_to, _value);
        return true;
    }
}
