pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "../../../interfaces/IZkAsset.sol";
import "../../../ACE/ACE.sol" as ACEModule;
import "../../../libs/NoteUtils.sol";
import "../../../libs/LibEIP712.sol";
import "../../../interfaces/IAZTEC.sol";
import "../../../interfaces/IERC20Mintable.sol";
import "../../GSNRecipientTimestampSignature.sol";

/**
 * @title Behaviour20200106 implementation
 * @author AZTEC
 * Note the behaviour contract version naming convention is based on the date on which the contract
 * was created, in the format: YYYYMMDD
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
contract Behaviour20200106 is GSNRecipientTimestampSignature, IAZTEC, LibEIP712 {
    using NoteUtils for bytes;

    /**
    * @dev epoch number, used for version control in upgradeability. The naming convention is based on the
    * date on which the contract was created, in the format: YYYYMMDD
    */
    uint256 public epoch = 20200106;

    mapping(address => bytes) public accountMapping;
    mapping(address => address) public userToAZTECAccountMapping;
    mapping(bytes32 => bool) public signatureLog;

    struct AZTECAccount {
        address account;
        bytes linkedPublicKey;
        address AZTECaddress;
    }

    string private constant EIP712_DOMAIN  = "EIP712Domain(string name,string version,address verifyingContract)";
    string private constant SIGNATURE_TYPE = "AZTECAccount(address account,bytes linkedPublicKey,address AZTECaddress)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(SIGNATURE_TYPE));

    event Addresses(address accountAddress, address signerAddress);

    event RegisterExtension(
        address indexed account,
        bytes linkedPublicKey,
        bytes spendingPublicKey
    );

    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);

    ACEModule.ACE ace;


    /**
    * @dev Initialize the contract and set up it's state. An initialize function rather than a constructor
    * is used to make this compatible with the upgradeability pattern
    * @param _aceAddress - address of the AZTEC Cryptography Engine
    * @param _trustedGSNSignerAddress - address which will produce signature to approve relayed GSN calls
    */
    function initialize(address _aceAddress, address _trustedGSNSignerAddress) initializer public {
        ace = ACEModule.ACE(_aceAddress);
        GSNRecipientTimestampSignature.initialize(_trustedGSNSignerAddress);
    }

    /**
    * @dev Calculates the EIP712 encoding for a hash struct in this EIP712 Domain.
    * @param _AZTECAccount - struct containing an Ethereum address and the linkedPublicKey
    * @return EIP712 hash applied to this EIP712 Domain.
    **/
    function hashAZTECAccount(AZTECAccount memory _AZTECAccount) internal view returns (bytes32) {
        bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("AccountRegistry"),
            keccak256("2"),
            address(this)
        ));

        return keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                SIGNATURE_TYPEHASH,
                _AZTECAccount.account,
                keccak256(bytes(_AZTECAccount.linkedPublicKey)),
                _AZTECAccount.AZTECaddress
        ))));
    }

    /**
     * @dev Registers a linkedPublicKey to an Ethereum address, if a valid signature is provided or the
     * sender is the ethereum address in question
     * @param _account - address to which the linkedPublicKey is being registered
     * @param _linkedPublicKey - an additional public key which the sender wishes to link to the _account
     * @param _spendingPublicKey - the Ethereum public key associated with the Ethereum address
     * @param _signature - an EIP712 compatible signature of the account & linkedPublicKey
     */
    function registerAZTECExtension(
        address _account,
        address _AZTECaddress,
        bytes memory _linkedPublicKey,
        bytes memory _spendingPublicKey,
        bytes memory _signature
    ) public {

        // signature replay protection
        bytes32 signatureHash = keccak256(abi.encodePacked(_signature));
        require(signatureLog[signatureHash] != true, "signature has already been used");
        signatureLog[signatureHash] = true;

        address signer = recoverSignature(
            hashAZTECAccount(AZTECAccount(_account, _linkedPublicKey, _AZTECaddress)),
            _signature
        );
        require(_account == address(uint160(uint256(keccak256(_spendingPublicKey)))),
            'address does not match public key');
        require(_account == signer, 'signer must be the account');
        accountMapping[_account] = _linkedPublicKey;
        userToAZTECAccountMapping[_account] = _AZTECaddress;

        emit Addresses(_account, signer);
        emit RegisterExtension(_account, _linkedPublicKey, _spendingPublicKey);
    }

    /**
    * @dev Perform a confidential transfer, mediated by a smart contracrt
    * @param _proofId - uint24 proofId
    * @param _registryOwner - address of the note registry owner
    * @param _proofData - data generated from proof construction, which is used to validate the proof
    * @param _spender - address that will be spending the notes
    * @param _proofSignature - EIP712 signature used to approve/revoke permission for the proof
    * to be spent
    */
    function confidentialTransferFrom(
        uint24 _proofId,
        address _registryOwner,
        bytes memory _proofData,
        address _spender,
        bytes memory _proofSignature
    ) public {
        bytes memory proofOutputs = ace.validateProof(_proofId, address(this), _proofData);

        if(_proofSignature.length != 0) {
            IZkAsset(_registryOwner).approveProof(_proofId, proofOutputs, _spender, true, _proofSignature);
        }
        IZkAsset(_registryOwner).confidentialTransferFrom(_proofId, proofOutputs.get(0));
    }

    /**
    * @dev Deposit ERC20 tokens into zero-knowledge notes in a transaction mediated via the GSN. Called by a user
    * @param _registryOwner - owner of the zkAsset
    * @param _owner - owner of the ERC20s being deposited
    * @param _proofHash - hash of the zero-knowledge deposit proof
    * @param _proofData - cryptographic data associated with the zero-knowledge proof
    * @param _value - number of ERC20s being deposited
     */
    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes memory _proofData,
        uint256 _value
    ) public {
        bytes memory proofOutputs = ace.validateProof(
            JOIN_SPLIT_PROOF,
            address(this),
            _proofData
        );

        if (_owner != _msgSender()) {
            require(
                userToAZTECAccountMapping[_owner] == _msgSender(),
                "Sender has no permission to deposit on owner's behalf."
            );

            (,
            bytes memory proofOutputNotes,
            ,
            ) = proofOutputs.get(0).extractProofOutput();
            uint256 numberOfNotes = proofOutputNotes.getLength();
            for (uint256 i = 0; i < numberOfNotes; i += 1) {
                (address owner,,) = proofOutputNotes.get(i).extractNote();
                require(owner == _owner, "Cannot deposit note to other account if sender is not the same as owner.");
            }
        }

        (address linkedTokenAddress,,,,,,,) = ace.getRegistry(_registryOwner);
        IERC20Mintable linkedToken = IERC20Mintable(linkedTokenAddress);

        linkedToken.transferFrom(
            _owner,
            address(this),
            _value
        );

        linkedToken.approve(address(ace), _value);

        ace.publicApprove(_registryOwner, _proofHash, _value);

        IZkAsset(_registryOwner).confidentialTransferFrom(
            JOIN_SPLIT_PROOF,
            proofOutputs.get(0)
        );
    }

    /**
    * @dev Approve a registry to spend up to a number of tokens, for a particular proof
    * @param _registryOwner - address that is being approved to spend the tokens
    * @param _proofHash - hash of the proof which is being approved to result in the spending of tokens
    * @param _value - numer of tokens spending is approved up to
    */
    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) public {
        ace.publicApprove(_registryOwner, _proofHash, _value);
    }

    /**
    * @dev Emits an event, annoucing that the relayed call has been successfully executed
    * @param context - second argument in the tuple returned by acceptRelayedCall
    * @param success - bool specifying whether the relayed call was successfully executed
    * @param actualCharge - estimate of the transaction gas cost
    * @param preRetVal - the return value of preRelayedCall
    */
    function _postRelayedCall(bytes memory context, bool success, uint256 actualCharge, bytes32 preRetVal) internal {
        (bytes memory approveData) = abi.decode(context, (bytes));
        emit GSNTransactionProcessed(keccak256(approveData), success, actualCharge);
    }
}
