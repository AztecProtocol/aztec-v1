pragma solidity >=0.5.0 <0.6.0;

import "../../../../AccountRegistry/epochs/20200106/Behaviour20200106.sol";

/**
  * @title TestBehaviourEpoch
  * @author AZTEC
  * @dev Deploys a TestBehaviourEpoch. This deliberately has an incorrect epoch number - 1, rather than the 
  * correct value of 2. This is done to assist testing of the account registry versioning system.
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
contract TestBehaviourEpoch is Behaviour20200106 {
    uint256 public epoch = 0;

    function newFeature() pure public returns (string memory result) {
        result = 'newFeature';
        return result;
    }
}
