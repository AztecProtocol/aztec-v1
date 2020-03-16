pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/NoteRegistryFactory.sol";
import "./BehaviourAdjustable201911.sol";

/**
 * @title FactoryAdjustable201911
 * @author AZTEC
 * @dev Deploys a BehaviourAdjustable201911
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
contract FactoryAdjustable201911 is NoteRegistryFactory {
    constructor(address _aceAddress) public NoteRegistryFactory(_aceAddress) {}

    function deployNewBehaviourInstance()
        public
        onlyOwner
        returns (address)
    {
        BehaviourAdjustable201911 behaviourContract = new BehaviourAdjustable201911();
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}
