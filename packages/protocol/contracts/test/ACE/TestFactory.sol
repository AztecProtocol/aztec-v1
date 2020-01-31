pragma solidity >=0.5.0 <0.6.0;

import "../../ACE/noteRegistry/epochs/201907/base/FactoryBase201907.sol";
import "../../Proxies/BaseAdminUpgradeabilityProxy.sol";

/**
  * @title TestFactory
  * @author AZTEC
  * @dev Deploys a TestFactory

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
contract TestFactory is FactoryBase201907 {
    constructor(address _aceAddress) public FactoryBase201907(_aceAddress) {}

    function getImplementation(address payable _proxyAddress) public returns (address implementation) {
        implementation = BaseAdminUpgradeabilityProxy(_proxyAddress).implementation();
    }
}
