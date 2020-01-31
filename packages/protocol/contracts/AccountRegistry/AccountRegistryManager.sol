pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./interfaces/IAccountRegistryBehaviour.sol";
import "../Proxies/AdminUpgradeabilityProxy.sol";
import "../Proxies/BaseAdminUpgradeabilityProxy.sol";
import "../interfaces/ProxyAdmin.sol";
import "../libs/Modifiers.sol";

/**
 * @title AccountRegistryManager
 * @author AZTEC
 * @dev Manager contract that manages the deployment of the proxy contract and upgrading the
 * account registry implementation.
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
*/
contract AccountRegistryManager is Ownable, Modifiers {
    using SafeMath for uint256;

    address payable public proxyAddress;
    uint256 public latestEpoch;

    event CreateProxy(address indexed proxyAddress, address indexed proxyAdmin);
    event UpdateLatestEpoch(uint256 newLatestEpoch);
    event UpgradeAccountRegistry(address indexed proxyAddress, address indexed newBehaviourAddress);

    /**
     * @dev Constructor which deploys the proxy contract. The proxy contract stores all state for the
     * AccountRegistry contract system
     * @param initialBehaviourAddress - address of the behaviour contract to be linked to be initialised
     * when the proxy is deployed
     * @param aceAddress - address of ACE
     * @param trustedGSNSignerAddress - address that is being trusted to produce signatures to approve
     * relayed GSN calls
     */
    constructor(
        address initialBehaviourAddress,
        address aceAddress,
        address trustedGSNSignerAddress
    ) public checkZeroAddress(initialBehaviourAddress) {
        bytes memory initialiseData = abi.encodeWithSignature(
            "initialize(address,address)",
            aceAddress,
            trustedGSNSignerAddress
        );
        address adminAddress = address(this);

        proxyAddress = address(new AdminUpgradeabilityProxy(
            initialBehaviourAddress,
            adminAddress,
            initialiseData
        ));

        uint256 initialEpoch = 1;
        updateLatestEpoch(initialEpoch);

        emit CreateProxy(proxyAddress, adminAddress);
    }

    /**
     * @dev Get the current behaviour contract address
     * @return implementation - address of the behaviour contract
     */
    function getImplementation() public returns (address implementation) {
        implementation = BaseAdminUpgradeabilityProxy(proxyAddress).implementation();
    }

    /**
     * @dev Update the `latestEpoch` storage variable.
     * @param newEpochNum - epoch number with which to update the latestEpoch
     */
    function updateLatestEpoch(uint256 newEpochNum) internal {
        latestEpoch = newEpochNum;
        emit UpdateLatestEpoch(latestEpoch);
    }

    /**
     * @dev Upgrade the account registry to a new behaviour implementation
     * @param newBehaviourAddress - address of the behaviour contract to be upgraded to
    */
    function upgradeAccountRegistry(
        address newBehaviourAddress
    ) public onlyOwner checkZeroAddress(newBehaviourAddress) {
        require(ProxyAdmin(proxyAddress).admin() == address(this), 'this is not the admin of the proxy');

        uint256 newBehaviourEpoch = IAccountRegistryBehaviour(newBehaviourAddress).epoch();
        require(
            newBehaviourEpoch > latestEpoch,
            'expected new registry to be of epoch greater than existing registry'
        );

        ProxyAdmin(proxyAddress).upgradeTo(newBehaviourAddress);

        updateLatestEpoch(newBehaviourEpoch);
        emit UpgradeAccountRegistry(proxyAddress, newBehaviourAddress);
    }
}
