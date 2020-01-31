pragma solidity >=0.5.0 <0.6.0;

/**
 * @title PublicRangeInterface
 * @author AZTEC
 * @dev An interface for the Public Range validator contract
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
interface PublicRangeInterface {
    /* solhint-disable-next-line var-name-mixedcase */
    
    function validatePublicRange(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) external pure returns (bytes memory);
}
