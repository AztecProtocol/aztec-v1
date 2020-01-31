pragma solidity >=0.5.0 <0.6.0;

import "../../../../../interfaces/IAZTEC.sol";
import "../../../../../libs/NoteUtils.sol";
import "../Behaviour201912.sol";
import "../../201911/adjustable/BehaviourAdjustable201911.sol";

/**
 * @title BehaviourBase201912
 * @author AZTEC
 * @dev This contract extends Behaviour201912.
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
contract BehaviourAdjustable201912 is Behaviour201912, BehaviourAdjustable201911 {
    constructor () BehaviourAdjustable201911() public {}

    function burn(bytes memory _proofOutputs) public onlyOwner {
        super.burn(_proofOutputs);
    }

    function mint(bytes memory _proofOutputs) public onlyOwner {
        super.mint(_proofOutputs);
    }
}
