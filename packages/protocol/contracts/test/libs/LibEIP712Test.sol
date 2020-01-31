pragma solidity >=0.5.0 <0.6.0;

import "../../libs/LibEIP712.sol";

/**
 * @title LibEIP712Test
 * @author AZTEC
 * @dev Library of EIP712 utility constants and functions
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
contract LibEIP712Test is LibEIP712 {

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
    ) public view returns (address _signer) {
        _signer = super.recoverSignature(_message, _signature);
    }
}
