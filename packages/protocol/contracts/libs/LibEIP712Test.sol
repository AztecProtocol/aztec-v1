pragma solidity >=0.5.0 <0.6.0;

import "./LibEIP712.sol";

contract LibEIP712Test is LibEIP712 {

    event Bar(uint256 timestamp);

    /// @dev Used only for debugging purposes: getting the r,s,v params
    /// needed in `recoverSignature`.
    function foo() public {
        emit Bar(now);
    }

    /// @dev Calculates EIP712 encoding for a hash struct in this EIP712 Domain.
    /// @param _hashStruct The EIP712 hash struct.
    /// @return EIP712 hash applied to this EIP712 Domain.
    function _hashEIP712Message(bytes32 _hashStruct)
        public
        view
        returns (bytes32 _result)
    {
        _result = super.hashEIP712Message(_hashStruct);
    }

    /// @dev Extracts the address of the signer with ECDSA.
    /// @param _message The EIP712 message.
    /// @param _signature The ECDSA values, v, r and s.
    /// @return The address of the message signer.
    function _recoverSignature(
        bytes32 _message,
        bytes memory _signature
    ) public returns (address _signer) {
        _signer = super.recoverSignature(_message, _signature);
    }
}
