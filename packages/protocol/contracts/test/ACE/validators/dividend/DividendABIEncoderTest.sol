pragma solidity >=0.5.0 <0.6.0;

import "../../../../ACE/validators/dividend/DividendABIEncoder.sol";

/**
 * @title DividendABIEncoderTest
 * @author AZTEC
 * @dev Dividend computation ABI Encoder Test
 * Don't include this as an internal library. This contract uses a static memory table to cache
 * elliptic curve primitives and hashes.
 * Calling this internally from another function will lead to memory mutation and undefined behaviour.
 * The intended use case is to call this externally via `staticcall`.
 * External calls to OptimizedAZTEC can be treated as pure functions as this contract contains no
 * storage and makes no external calls (other than to precompiles)
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
contract DividendABIEncoderTest {
    function validateDividend(
        bytes calldata,
        address,
        uint[6] calldata
    )
        external
        pure
        returns (bytes memory)
    {
        DividendABIEncoder.encodeAndExit();
    }
}
