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

    address public GSNSigner;

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
        uint24 _proofId,
        address _registryOwner,
        bytes calldata _proofData,
        address _spender,
        bytes calldata _proofSignature,
        bytes calldata _proofSignature2   
    ) external;

    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes calldata _proofData,
        uint256 _value
    ) external;
    
    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes calldata _proofData,
        uint256 _value,
        bytes calldata signature,
        uint256 nonce,
        uint256 expiry
    ) external;

    function permit(
        address linkedTokenAddress,
        address holder,
        uint256 nonce,
        bool allowed,
        uint256 expiry,
        address spender,
        bytes calldata signature
    ) external;

    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) external;

    function acceptRelayedCall(
        address relay,
        address from,
        bytes calldata encodedFunction,
        uint256 transactionFee,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 nonce,
        bytes calldata approvalData,
        uint256
    ) external returns(uint256, bytes memory context);

    function setGSNSigner() external;

    event Addresses(address accountAddress, address signerAddress);
    
    event RegisterExtension(
        address indexed account,
        bytes linkedPublicKey,
        bytes spendingPublicKey 
    );

    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);

}
