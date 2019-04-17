pragma solidity >=0.5.0 <0.6.0;
import "../libs/LibEIP712.sol";


contract PublicRangeInterface {    
    function validatePublicRange(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        pure 
        returns (bytes32) 
    {}
}
