pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "../../../interfaces/IZkAsset.sol";
import "../../../ACE/ACE.sol" as ACEModule;
import "../../../libs/NoteUtils.sol";
import "../../../interfaces/IAZTEC.sol";
import "../../../interfaces/IERC20Mintable.sol";
import "../../GSNRecipientTimestampSignature.sol";
import "./base/BehaviourBase20200106.sol";

/**
 * @title Behaviour20200106 implementation
 * @author AZTEC
 * Note the behaviour contract version naming convention is based on the date on which the contract
 * was created, in the format: YYYYMMDD
    * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract Behaviour20200106 is BehaviourBase20200106, GSNRecipient, GSNRecipientTimestampSignature, IAZTEC {
    using NoteUtils for bytes;

    /**
    * @dev epoch number, used for version control in upgradeability. The naming convention is based on the 
    * date on which the contract was created, in the format: YYYYMMDD
    */
    uint256 public epoch = 20200106;

    ACEModule.ACE ace;

    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);

    /**
    * @dev Initialize the contract and set up it's state. An initialize function rather than a constructor
    * is used to make this compatible with the upgradeability pattern
    * @param _aceAddress - address of the AZTEC Cryptography Engine
    * @param _trustedGSNSignerAddress - address which will produce signature to approve relayed GSN calls
    */
    function initialize(address _aceAddress, address _trustedGSNSignerAddress) initializer public {
        ace = ACEModule.ACE(_aceAddress);
        GSNRecipient.initialize();
        GSNRecipientTimestampSignature.initialize(_trustedGSNSignerAddress);
    }

    /**
    * @dev Perform a confidential transfer, mediated by a smart contracrt
    * @param _registryOwner - address of the note registry owner
    * @param _proofData - data generated from proof construction, which is used to validate the proof
    * @param _noteHashes - array of hashes of notes involved in the transfer. A noteHash is a unique
    * identifier of a particular note
    * @param _spender - address that will be spending the notes
    * @param _spenderApprovals - array of booleans, matched one to one with the _noteHashes array. Each
    * boolean determines whether the particular note is being approved for spending, or if permission
    * is being revoked
    * @param _proofSignature - EIP712 signature used to approve/revoke permission for the proof
    * to be spent
    */
    function confidentialTransferFrom(
        address _registryOwner,
        bytes memory _proofData,
        bytes32[] memory _noteHashes,
        address _spender,
        bool[] memory _spenderApprovals,
        bytes memory _proofSignature
    ) public {
        bytes memory proofOutputs = ace.validateProof(JOIN_SPLIT_PROOF, address(this), _proofData);

        if(_proofSignature.length != 0) {
            IZkAsset(_registryOwner).approveProof(JOIN_SPLIT_PROOF, proofOutputs, _spender, true, _proofSignature);
        }
        IZkAsset(_registryOwner).confidentialTransferFrom(JOIN_SPLIT_PROOF, proofOutputs.get(0));
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
