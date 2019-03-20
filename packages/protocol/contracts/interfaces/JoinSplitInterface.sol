pragma solidity >=0.5.0 <0.6.0;

import "../libs/LibEIP712.sol";

contract JoinSplitInterface is LibEIP712 {
    /* solhint-disable-next-line var-name-mixedcase */
    bytes32 public EIP712_DOMAIN_HASH;

    constructor() public {}
    
    function validateJoinSplit(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external
        pure
        returns (bytes memory) 
    {}
}
