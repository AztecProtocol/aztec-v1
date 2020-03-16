pragma solidity >=0.5.0 <0.6.0;

import "../../libs/SafeMath8.sol";

/**
 * @title SafeMath8Test
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
contract SafeMath8Test {
    using SafeMath8 for uint8;

    function _mul(uint8 a, uint8 b) public pure returns (uint8) {
        return(a.mul(b));
    }

    function _add(uint8 a, uint8 b) public pure returns (uint8) {
        return(a.add(b));
    }

    function _sub(uint8 a, uint8 b) public pure returns (uint8) {
        return(a.sub(b));
    }
}
