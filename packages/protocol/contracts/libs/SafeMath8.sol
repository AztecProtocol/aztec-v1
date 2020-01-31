pragma solidity >=0.5.0 <= 0.6.0;

/**
 * @title SafeMath8
 * @author AZTEC
 * @dev Library of SafeMath arithmetic operations
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

library SafeMath8 {
    
    /**
    * @dev SafeMath multiplication
    * @param a - uint8 multiplier
    * @param b - uint8 multiplicand
    * @return uint8 result of multiplying a and b
    */
    function mul(uint8 a, uint8 b) internal pure returns (uint8) {
        uint256 c = uint256(a) * uint256(b);
        require(c < 256, "uint8 mul triggered integer overflow");
        return uint8(c);
    }

    /**
    * @dev SafeMath division
    * @param a - uint8 dividend
    * @param b - uint8 divisor
    * @return uint8 result of dividing a by b
    */
    function div(uint8 a, uint8 b) internal pure returns (uint8) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        // assert(a == b * c + a % b); // There is no case in which this doesn’t hold
        return a / b;
    }

    /**
    * @dev SafeMath subtraction
    * @param a - uint8 minuend
    * @param b - uint8 subtrahend
    * @return uint8 result of subtracting b from a
    */
    function sub(uint8 a, uint8 b) internal pure returns (uint8) {
        require(b <= a, "uint8 sub triggered integer underflow");
        return a - b;
    }

    /**
    * @dev SafeMath addition
    * @param a - uint8 addend
    * @param b - uint8 addend
    * @return uint8 result of adding a and b
    */
    function add(uint8 a, uint8 b) internal pure returns (uint8) {
        uint8 c = a + b;
        require(c >= a, "uint8 add triggered integer overflow");
        return c;
    }
}
