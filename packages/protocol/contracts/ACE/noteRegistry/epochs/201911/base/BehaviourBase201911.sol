pragma solidity >=0.5.0 <0.6.0;

import "../../../../../interfaces/IAZTEC.sol";
import "../../../../../libs/NoteUtils.sol";
import "../Behaviour201911.sol";
import "../../201907/base/BehaviourBase201907.sol";

/**
 * @title BehaviourBase201911
 * @author AZTEC
 * @dev This contract extends Behaviour201911 and BehaviourBase201907.
        Methods are documented in interface.
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
contract BehaviourBase201911 is Behaviour201911, BehaviourBase201907 {
    constructor () BehaviourBase201907() public {}
}
