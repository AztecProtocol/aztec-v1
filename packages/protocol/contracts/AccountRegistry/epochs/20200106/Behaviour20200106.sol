pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "../../../interfaces/IZkAsset.sol";
import "./base/BehaviourBase20200106.sol";
import "../../TransactionRelayer.sol";
import "../../GSNRecipientTimestampSignature.sol";

/**
 * @title Behaviour20200106 implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract Behaviour20200106 is BehaviourBase20200106, TransactionRelayer, GSNRecipient, GSNRecipientTimestampSignature {

    /**
    * @dev epoch number, used for version control in upgradeability
    */
    uint256 public epoch = 20200106;

    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);

    /**
    * @dev Initialize the contract and set up it's state. An initialize function rather than a constructor
    * is used to make this compatible with the upgradeability pattern
    * @param _aceAddress - address of the AZTEC Cryptography Engine
    * @param _trustedGSNSignerAddress - address which will produce signature to approve relayed GSN calls
    */
    function initialize(address _aceAddress, address _trustedGSNSignerAddress) initializer public {
        TransactionRelayer.initialize(_aceAddress);
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
    * @param _batchSignature - EIP712 signature used to approve/revoke permission for the array of notes
    * to be spent
    */
    function confidentialTransferFrom(
        address _registryOwner,
        bytes memory _proofData,
        bytes32[] memory _noteHashes,
        address _spender,
        bool[] memory _spenderApprovals,
        bytes memory _batchSignature
    ) public {
        if(_batchSignature.length != 0) {
            IZkAsset(_registryOwner).batchConfidentialApprove(_noteHashes, _spender,_spenderApprovals, _batchSignature);
        }
        (bytes memory proofOutputs) = ace.validateProof(JOIN_SPLIT_PROOF, address(this), _proofData);
        IZkAsset(_registryOwner).confidentialTransferFrom(JOIN_SPLIT_PROOF, proofOutputs.get(0));
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
