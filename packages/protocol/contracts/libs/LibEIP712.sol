pragma solidity >=0.5.0 <0.6.0;


/**
 * @title Library of EIP712 utility constants and functions
 * @author AZTEC
 *
 * Copyright 2020 Spilsbury Holdings Ltd 
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/
contract LibEIP712 {

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
        EIP712_DOMAIN_HASH = keccak256(abi.encode(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            address(this)
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
            // Load free memory pointer. We're not going to use it - we're going to overwrite it!
            // We need 0x60 bytes of memory for this hash,
            // cheaper to overwrite the free memory pointer at 0x40, and then replace it, than allocating free memory
            let memPtr := mload(0x40)
            mstore(0x00, 0x1901)               // EIP191 header
            mstore(0x20, eip712DomainHash)     // EIP712 domain hash
            mstore(0x40, _hashStruct)          // Hash of struct
            _result := keccak256(0x1e, 0x42)   // compute hash
            // replace memory pointer
            mstore(0x40, memPtr)
        }
    }

    /// @dev Extracts the address of the signer with ECDSA.
    /// @param _message The EIP712 message.
    /// @param _signature The ECDSA values, v, r and s.
    /// @return The address of the message signer.
    function recoverSignature(
        bytes32 _message,
        bytes memory _signature
    ) internal view returns (address _signer) {
        bool result;
        assembly {
            // Here's a little trick we can pull. We expect `_signature` to be a byte array, of length 0x60, with
            // 'v', 'r' and 's' located linearly in memory. Preceeding this is the length parameter of `_signature`.
            // We *replace* the length param with the signature msg to get a memory block formatted for the precompile
            // load length as a temporary variable

            let byteLength := mload(_signature)

            // store the signature message
            mstore(_signature, _message)

            // load 'v' - we need it for a condition check
            // add 0x60 to jump over 3 words - length of bytes array, r and s
            let v := mload(add(_signature, 0x60))
            let s := mload(add(_signature, 0x40))
            v := shr(248, v) // bitshifting, to resemble padLeft

            /**
            * Original memory map for input to precompile
            *
            * _signature : _signature + 0x20            message
            * _signature + 0x20 : _signature + 0x40     r
            * _signature + 0x40 : _signature + 0x60     s
            * _signature + 0x60 : _signature + 0x80     v

            * Desired memory map for input to precompile
            *
            * _signature : _signature + 0x20            message
            * _signature + 0x20 : _signature + 0x40     v
            * _signature + 0x40 : _signature + 0x60     r
            * _signature + 0x60 : _signature + 0x80     s
            */

            // move s to v position
            mstore(add(_signature, 0x60), mload(add(_signature, 0x40)))
            // move r to s position
            mstore(add(_signature, 0x40), mload(add(_signature, 0x20)))
            // move v to r position
            mstore(add(_signature, 0x20), v)
            result := and(
                and(
                    // validate s is in lower half order
                    lt(s, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0),
                    and(
                        // validate signature length == 0x41
                        eq(byteLength, 0x41),
                        // validate v == 27 or v == 28
                        or(eq(v, 27), eq(v, 28))
                    )
                ),
                // validate call to precompile succeeds
                staticcall(gas, 0x01, _signature, 0x80, _signature, 0x20)
            )
            // save the _signer only if the first word in _signature is not `_message` anymore
            switch eq(_message, mload(_signature))
            case 0 {
                _signer := mload(_signature)
            }
            mstore(_signature, byteLength) // and put the byte length back where it belongs
        }
        // wrap Failure States in a single if test, so that happy path only has 1 conditional jump
        if (!(result && (_signer != address(0x0)))) {
            require(_signer != address(0x0), "signer address cannot be 0");
            require(result, "signature recovery failed");
        }
    }
}

