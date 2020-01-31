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
