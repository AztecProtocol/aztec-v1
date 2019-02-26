pragma solidity >=0.5.0 <0.6.0;

/**
 * @title Maps a user's Ethereum address to the block number of a block that contains a transaction sent by the address
 * @author Tom Waite
 * @dev Purpose of this contract is to enable an AZTEC Dapp to get a user's public key from their Ethereum address.
 *      The public key is required in order to generate AZTEC note shared secrets.
 **/
contract Doorbell {

    mapping(address => uint) public addressBlockMap;

    /**
    * @dev Writes to ```addressBlockMap``` to map from msg.sender to block.number
    **/
    function setBlock() external {
        uint number = block.number; 
        addressBlockMap[msg.sender] = number;        
    }
}
