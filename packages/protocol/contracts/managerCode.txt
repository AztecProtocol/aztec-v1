
// File: openzeppelin-solidity/contracts/GSN/Context.sol

pragma solidity ^0.5.0;

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with GSN meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
contract Context {
    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal { }
    // solhint-disable-previous-line no-empty-blocks

    function _msgSender() internal view returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

// File: openzeppelin-solidity/contracts/ownership/Ownable.sol

pragma solidity ^0.5.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        _owner = _msgSender();
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: openzeppelin-solidity/contracts/math/SafeMath.sol

pragma solidity ^0.5.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     *
     * _Available since v2.4.0._
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// File: contracts/AccountRegistry/interfaces/IAccountRegistryBehaviour.sol

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
contract IAccountRegistryBehaviour {
    uint256 public epoch;

    struct AZTECAccount {
        address account;
        bytes linkedPublicKey;
    }

    mapping(address => bytes) public accountMapping;
    mapping(address => address) public userToAZTECAccountMapping;
    mapping(bytes32 => bool) public signatureLog;

    function registerAZTECExtension(
        address _account,
        address _AZTECaddress,
        bytes calldata _linkedPublicKey,
        bytes calldata _spendingPublicKey,
        bytes calldata _signature
    ) external;

    function initialize(address _aceAddress, address _trustedGSNSignerAddress) external;

    function confidentialTransferFrom(
        address _registryOwner,
        bytes calldata _proofData,
        bytes32[] calldata _noteHashes,
        address _spender,
        bool[] calldata _spenderApprovals,
        bytes calldata _batchSignature
    ) external;

    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes calldata _proofData,
        uint256 _value
    ) external;

    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) external;

    event Addresses(address accountAddress, address signerAddress);
    
    event RegisterExtension(
        address indexed account,
        bytes linkedPublicKey,
        bytes spendingPublicKey 
    );
}

// File: openzeppelin-solidity/contracts/utils/Address.sol

pragma solidity ^0.5.5;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * This test is non-exhaustive, and there may be false-negatives: during the
     * execution of a contract's constructor, its address will be reported as
     * not containing a contract.
     *
     * IMPORTANT: It is unsafe to assume that an address for which this
     * function returns false is an externally-owned account (EOA) and not a
     * contract.
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies in extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        // According to EIP-1052, 0x0 is the value returned for not-yet created accounts
        // and 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 is returned
        // for accounts without code, i.e. `keccak256('')`
        bytes32 codehash;
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        // solhint-disable-next-line no-inline-assembly
        assembly { codehash := extcodehash(account) }
        return (codehash != 0x0 && codehash != accountHash);
    }

    /**
     * @dev Converts an `address` into `address payable`. Note that this is
     * simply a type cast: the actual underlying value is not changed.
     *
     * _Available since v2.4.0._
     */
    function toPayable(address account) internal pure returns (address payable) {
        return address(uint160(account));
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     *
     * _Available since v2.4.0._
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        // solhint-disable-next-line avoid-call-value
        (bool success, ) = recipient.call.value(amount)("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }
}

// File: contracts/Proxies/Proxy.sol

pragma solidity ^0.5.0;

/**
 * @title Proxy
 * @dev Implements delegation of calls to other contracts, with proper
 * forwarding of return values and bubbling of failures.
 * It defines a fallback function that delegates all calls to the address
 * returned by the abstract _implementation() internal function.
 */
contract Proxy {
    /**
    * @dev Fallback function.
    * Implemented entirely in `_fallback`.
    */
    function () payable external {
        _fallback();
    }

    /**
    * @return The Address of the implementation.
    */
    function _implementation() internal view returns (address);

    /**
    * @dev Delegates execution to an implementation contract.
    * This is a low level function that doesn't return to its internal call site.
    * It will return to the external caller whatever the implementation returns.
    * @param implementation Address to delegate.
    */
    function _delegate(address implementation) internal {
        assembly {
        // Copy msg.data. We take full control of memory in this inline assembly
        // block because it will not return to Solidity code. We overwrite the
        // Solidity scratch pad at memory position 0.
        calldatacopy(0, 0, calldatasize)

        // Call the implementation.
        // out and outsize are 0 because we don't know the size yet.
        let result := delegatecall(gas, implementation, 0, calldatasize, 0, 0)

        // Copy the returned data.
        returndatacopy(0, 0, returndatasize)

        switch result
        // delegatecall returns 0 on error.
        case 0 { revert(0, returndatasize) }
        default { return(0, returndatasize) }
        }
    }

    /**
    * @dev Function that is run as the first thing in the fallback function.
    * Can be redefined in derived contracts to add functionality.
    * Redefinitions must call super._willFallback().
    */
    function _willFallback() internal {
    }

    /**
    * @dev fallback implementation.
    * Extracted to enable manual triggering.
    */
    function _fallback() internal {
        _willFallback();
        _delegate(_implementation());
    }
}

// File: contracts/Proxies/BaseUpgradeabilityProxy.sol

pragma solidity ^0.5.0;



/**
 * @title BaseUpgradeabilityProxy
 * @dev This contract implements a proxy that allows to change the
 * implementation address to which it will delegate.
 * Such a change is called an implementation upgrade.
 */
contract BaseUpgradeabilityProxy is Proxy {
    /**
    * @dev Emitted when the implementation is upgraded.
    * @param implementation Address of the new implementation.
    */
    event Upgraded(address indexed implementation);

    /**
    * @dev Storage slot with the address of the current implementation.
    * This is the keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1, and is
    * validated in the constructor.
    */
    bytes32 internal constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    /**
    * @dev Returns the current implementation.
    * @return Address of the current implementation
    */
    function _implementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
        impl := sload(slot)
        }
    }

    /**
    * @dev Upgrades the proxy to a new implementation.
    * @param newImplementation Address of the new implementation.
    */
    function _upgradeTo(address newImplementation) internal {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    /**
    * @dev Sets the implementation address of the proxy.
    * @param newImplementation Address of the new implementation.
    */
    function _setImplementation(address newImplementation) internal {
        require(Address.isContract(newImplementation), "Cannot set a proxy implementation to a non-contract address");

        bytes32 slot = IMPLEMENTATION_SLOT;

        assembly {
        sstore(slot, newImplementation)
        }
    }
}

// File: contracts/Proxies/UpgradeabilityProxy.sol

pragma solidity ^0.5.0;


/**
 * @title UpgradeabilityProxy
 * @dev Extends BaseUpgradeabilityProxy with a constructor for initializing
 * implementation and init data.
 */
contract UpgradeabilityProxy is BaseUpgradeabilityProxy {
    /**
    * @dev Contract constructor.
    * @param _logic Address of the initial implementation.
    * @param _data Data to send as msg.data to the implementation to initialize the proxied contract.
    * It should include the signature and the parameters of the function to be called, as described in
    * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
    * This parameter is optional, if no data is given the initialization call to proxied contract will be skipped.
    */
    constructor(address _logic, bytes memory _data) public payable {
        assert(IMPLEMENTATION_SLOT == bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1));
        _setImplementation(_logic);
        if(_data.length > 0) {
            (bool success,) = _logic.delegatecall(_data);
            require(success);
        }
    }
}

// File: contracts/Proxies/BaseAdminUpgradeabilityProxy.sol

pragma solidity ^0.5.0;


/**
    * @title BaseAdminUpgradeabilityProxy
    * @dev This contract combines an upgradeability proxy with an authorization
    * mechanism for administrative tasks.
    * All external functions in this contract must be guarded by the
    * `ifAdmin` modifier. See ethereum/solidity#3864 for a Solidity
    * feature proposal that would enable this to be done automatically.
 */
contract BaseAdminUpgradeabilityProxy is BaseUpgradeabilityProxy {
    /**
    * @dev Emitted when the administration has been transferred.
    * @param previousAdmin Address of the previous admin.
    * @param newAdmin Address of the new admin.
    */
    event AdminChanged(address previousAdmin, address newAdmin);

    /**
    * @dev Storage slot with the admin of the contract.
    * This is the keccak-256 hash of "eip1967.proxy.admin" subtracted by 1, and is
    * validated in the constructor.
    */

    bytes32 internal constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    /**
    * @dev Modifier to check whether the `msg.sender` is the admin.
    * If it is, it will run the function. Otherwise, it will delegate the call
    * to the implementation.
    */
    modifier ifAdmin() {
        if (msg.sender == _admin()) {
            _;
        } else {
            _fallback();
        }
    }

    /**
    * @return The address of the proxy admin.
    */
    function admin() external ifAdmin returns (address) {
        return _admin();
    }

    /**
    * @return The address of the implementation.
    */
    function implementation() external ifAdmin returns (address) {
        return _implementation();
    }

    /**
    * @dev Changes the admin of the proxy.
    * Only the current admin can call this function.
    * @param newAdmin Address to transfer proxy administration to.
    */
    function changeAdmin(address newAdmin) external ifAdmin {
        require(newAdmin != address(0), "Cannot change the admin of a proxy to the zero address");
        emit AdminChanged(_admin(), newAdmin);
        _setAdmin(newAdmin);
    }

    /**
    * @dev Upgrade the backing implementation of the proxy.
    * Only the admin can call this function.
    * @param newImplementation Address of the new implementation.
    */
    function upgradeTo(address newImplementation) external ifAdmin {
        _upgradeTo(newImplementation);
    }

    /**
    * @dev Upgrade the backing implementation of the proxy and call a function
    * on the new implementation.
    * This is useful to initialize the proxied contract.
    * @param newImplementation Address of the new implementation.
    * @param data Data to send as msg.data in the low level call.
    * It should include the signature and the parameters of the function to be called, as described in
    * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
    */
    function upgradeToAndCall(address newImplementation, bytes calldata data) payable external ifAdmin {
        _upgradeTo(newImplementation);
        (bool success,) = newImplementation.delegatecall(data);
        require(success);
    }

    /**
    * @return The admin slot.
    */
    function _admin() internal view returns (address adm) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
        adm := sload(slot)
        }
    }

    /**
    * @dev Sets the address of the proxy admin.
    * @param newAdmin Address of the new proxy admin.
    */
    function _setAdmin(address newAdmin) internal {
        bytes32 slot = ADMIN_SLOT;

        assembly {
        sstore(slot, newAdmin)
        }
    }

    /**
    * @dev Only fall back when the sender is not the admin.
    */
    function _willFallback() internal {
        require(msg.sender != _admin(), "Cannot call fallback function from the proxy admin");
        super._willFallback();
    }
}

// File: contracts/Proxies/AdminUpgradeabilityProxy.sol

pragma solidity ^0.5.0;


/**
 * @title AdminUpgradeabilityProxy
 * @dev Extends from BaseAdminUpgradeabilityProxy with a constructor for
 * initializing the implementation, admin, and init data.
 */
contract AdminUpgradeabilityProxy is BaseAdminUpgradeabilityProxy, UpgradeabilityProxy {
    /**
    * Contract constructor.
    * @param _logic address of the initial implementation.
    * @param _admin Address of the proxy administrator.
    * @param _data Data to send as msg.data to the implementation to initialize the proxied contract.
    * It should include the signature and the parameters of the function to be called, as described in
    * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
    * This parameter is optional, if no data is given the initialization call to proxied contract will be skipped.
    */
    constructor(address _logic, address _admin, bytes memory _data) UpgradeabilityProxy(_logic, _data) public payable {
        assert(ADMIN_SLOT == bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1));
        require(_admin != address(0x0), "Cannot set the admin address to address(0x0)");
        _setAdmin(_admin);
    }
}

// File: contracts/interfaces/ProxyAdmin.sol

pragma solidity ^0.5.0;

/**
 * @title ProxyAdmin
 * @dev Minimal interface for the proxy contract
 */
contract ProxyAdmin {
    function admin() external returns (address);

    function upgradeTo(address _newImplementation) external;

    function changeAdmin(address _newAdmin) external;
}

// File: contracts/libs/Modifiers.sol

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
contract Modifiers {
    
    /**
    * @dev Check that the input address is not 0x0, and revert if it is
    */
    modifier checkZeroAddress(address addressToCheck) {
        require(addressToCheck != address(0x0), 'address can not be 0x0');
        _;
    }
}

// File: contracts/AccountRegistry/AccountRegistryManager.sol

pragma solidity >=0.5.0 <0.6.0;








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
