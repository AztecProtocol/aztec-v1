pragma solidity >=0.5.0 <0.6.0;
import "../../AccountRegistry/epochs/20200106/Behaviour20200106.sol";

contract TestAccountMapping is Behaviour20200106 {
    constructor(address _aceAddress, address _trustedGSNSignerAddress) public {
        Behaviour20200106.initialize(_aceAddress, _trustedGSNSignerAddress);
    }
    function setAccountMapping(address _address, bytes memory _linkedPublicKey) public {
        accountMapping[_address] = _linkedPublicKey;
    }

    function setAccountAliasMapping(address _address, address _aliasAddress) public {
        userToAZTECAccountMapping[_address] = _aliasAddress;
    }
}
