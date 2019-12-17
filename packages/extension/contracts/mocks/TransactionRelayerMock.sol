pragma solidity >=0.5.0 <0.6.0;
import "../TransactionRelayer.sol";

contract TransactionRelayerMock is TransactionRelayer {
    constructor(
        address _ace
    ) public TransactionRelayer(_ace) {}

    function setAccountMapping(address _address, bytes memory _linkedPublicKey) public {
        accountMapping[_address] = _linkedPublicKey;
    }
}
