pragma solidity >=0.5.0 <0.6.0;

/*
  Copyright Spilsbury Holdings Ltd 2018.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Forked from https://github.com/0xProject/0x-monorepo
*/

contract IEIP712 {

    // EIP191 header for EIP712 prefix
    string constant internal EIP191_HEADER = "\x19\x01";

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "AZTEC_CRYPTOGRAPHY_ENGINE";

    // EIP712 Domain Version value
    string constant internal EIP712_DOMAIN_VERSION = "1";

    // Hash of the EIP712 Domain Separator Schema
    bytes32 constant internal EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(abi.encodePacked(
        "EIP712Domain(",
            "string name,",
            "string version,",
            "address verifyingContract",
        ")"
    ));

    // Hash of the EIP712 Domain Separator data
    // solhint-disable-next-line var-name-mixedcase
    bytes32 public EIP712_DOMAIN_HASH;

    constructor ()
        public
    {
        EIP712_DOMAIN_HASH = keccak256(abi.encodePacked(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            bytes32(uint256(address(this)))
        ));
    }

    /// @dev Calculates EIP712 encoding for a hash struct in this EIP712 Domain.
    /// @param _hashStruct The EIP712 hash struct.
    /// @return EIP712 hash applied to this EIP712 Domain.
    function hashEIP712Message(bytes32 _hashStruct)
        internal
        view
        returns (bytes32 _result)
    {
        bytes32 eip712DomainHash = EIP712_DOMAIN_HASH;

        // Assembly for more efficient computing:
        // keccak256(abi.encodePacked(
        //     EIP191_HEADER,
        //     EIP712_DOMAIN_HASH,
        //     hashStruct    
        // ));

        assembly {
            // Load free memory pointer
            let memPtr := mload(0x40)

            mstore(memPtr, 0x1901000000000000000000000000000000000000000000000000000000000000)  // EIP191 header
            mstore(add(memPtr, 0x02), eip712DomainHash)                                         // EIP712 domain hash
            mstore(add(memPtr, 0x22), _hashStruct)                                              // Hash of struct

            // Compute hash
            _result := keccak256(memPtr, 0x42)
        }
        return _result;
    }

    /// @dev Extracts the address of the signer with ECDSA.
    /// @param _message The EIP712 message.
    /// @param _signature The ECDSA values, r, c and v.
    /// @return The address of the message signer.
    function recoverSignature(
        bytes32 _message,
        bytes memory _signature
    ) internal view returns (address _signer) {
        bool result;
        assembly {
            let r := mload(add(_signature, 0x20))
            let s := mload(add(_signature, 0x40))
            let v := byte(0, mload(add(_signature, 0x60)))
            let memPtr := mload(0x40)
            mstore(memPtr, _message)
            mstore(add(memPtr, 0x20), v)
            mstore(add(memPtr, 0x40), r)
            mstore(add(memPtr, 0x60), s)
            result := and(
                and(
                    eq(mload(_signature), 0x41),
                    or(eq(v, 27), eq(v, 28))
                ),
                staticcall(gas, 0x01, memPtr, 0x80, memPtr, 0x20)
            )
            _signer := mload(memPtr)
        }
        require(result, "signature recovery failed!");
        require(_signer != address(0), "signer address cannot be 0");
    }
}

