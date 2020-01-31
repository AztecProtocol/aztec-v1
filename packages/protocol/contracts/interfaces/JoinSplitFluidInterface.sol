pragma solidity >=0.5.0 <0.6.0;

import "../libs/LibEIP712.sol";

/**
 * @title JoinSplitFluidInterface
 * @author AZTEC
 * @dev Interface for the JoinSplitFluid validator contract
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
contract JoinSplitFluidInterface is LibEIP712 {
    /* solhint-disable-next-line var-name-mixedcase */

    constructor() public {}

    function validateJoinSplitFluid(
        bytes calldata, // proof data
        address, // sender address
        uint[6] calldata // common reference string
    )
        external
        pure
        returns (bytes memory) // returns a series of transfer instructions
    {}
}
