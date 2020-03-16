pragma solidity ^0.5.0;

/**
 * @title BehaviourWithConflictTest
 * @author AZTEC
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
contract BehaviourWithConflictTest {
    event ReachedBehaviour();

    /**
        * @return The address of the proxy admin.
    */
    function admin() external returns (address) {
        emit ReachedBehaviour();
        return address(0x0);
    }
}
