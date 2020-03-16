pragma solidity >=0.5.0 <0.6.0;

/**
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
contract IAccountRegistryManager {
    address payable public proxyAddress;
    uint256 public latestEpoch;

    function getImplementation() external;

    function isOwner() external view;

    function renounceOwnership() external;

    function transferOwnership(address newOwner) external;
 
    function upgradeAccountRegistry(address newBehaviourAddress) external;
    
    event CreateProxy(address indexed proxyAddress, address indexed proxyAdmin);

    event UpdateLatestEpoch(uint256 newLatestEpoch);

    event UpgradeAccountRegistry(address indexed proxyAddress, address indexed newBehaviourAddress);
}
