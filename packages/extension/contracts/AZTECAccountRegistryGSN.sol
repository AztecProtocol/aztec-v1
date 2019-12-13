pragma solidity >=0.5.0 <0.6.0;
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";
import "@aztec/protocol/contracts/interfaces/IZkAsset.sol";
import "./AZTECAccountRegistry.sol";
import "./TransactionRelayer.sol";
import "./GSNRecipientTimestampSignature.sol";

/**
 * @title AZTECAccountRegistryGSN implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract AZTECAccountRegistryGSN is AZTECAccountRegistry, TransactionRelayer, GSNRecipient, GSNRecipientTimestampSignature {
    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);

    constructor(
        address _ace,
        address _trustedAddress
    ) public TransactionRelayer(_ace) {
        GSNRecipient.initialize();
        GSNRecipientTimestampSignature.initialize(_trustedAddress);
    }

    function confidentialTransferFrom(address _registryOwner,
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

    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) public {
        ace.publicApprove(_registryOwner, _proofHash, _value);
    }

    function _postRelayedCall(bytes memory context, bool success, uint256 actualCharge, bytes32 preRetVal) internal {
        (bytes memory approveData) = abi.decode(context, (bytes));
        emit GSNTransactionProcessed(keccak256(approveData), success, actualCharge);
    }
}
