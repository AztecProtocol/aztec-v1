pragma solidity >=0.5.0 <0.6.0;

contract JoinSplitInterface {
    /* solhint-disable-next-line var-name-mixedcase */

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
