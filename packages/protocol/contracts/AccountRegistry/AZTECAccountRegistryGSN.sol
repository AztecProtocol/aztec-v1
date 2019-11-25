pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/bouncers/GSNBouncerSignature.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";

import "../libs/NoteUtils.sol";
import "../interfaces/IZkAsset.sol";
import "../interfaces/IERC20.sol";
import "./../interfaces/IAZTEC.sol";
import "./../ACE/ACE.sol" as ACEModule;
import "./AZTECAccountRegistry.sol";


/**
 * @title AZTECAccountRegistryGSN implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract AZTECAccountRegistryGSN is IAZTEC, AZTECAccountRegistry, GSNRecipient, GSNBouncerSignature {

    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);

    ACEModule.ACE ace;
    uint24 public constant JOIN_SPLIT_PROOF = 65793;
    using NoteUtils for bytes;
    constructor(
        address _ace,
        address _trustedAddress
    ) public {
        GSNRecipient.initialize();
        GSNBouncerSignature.initialize(_trustedAddress);
        ace = ACEModule.ACE(_ace);
    }

    function confidentialTransferFrom(address _registryOwner, bytes memory _proofData) public {
        (bytes memory proofOutputs) = ace.validateProof(JOIN_SPLIT_PROOF, address(this), _proofData);
        IZkAsset(_registryOwner).confidentialTransferFrom(JOIN_SPLIT_PROOF, proofOutputs.get(0));
    }

    function confidentialTransfer(address _registryOwner, bytes memory _proofData, bytes memory _signatures) public {
        IZkAsset(_registryOwner).confidentialTransfer(_proofData, _signatures);
    }

    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) public {
        ace.publicApprove(_registryOwner, _proofHash, _value);
    }

    /*
    https://docs.openzeppelin.com/contracts/2.x/gsn
    */
    function postRelayedCall(bytes calldata context, bool success, uint actualCharge, bytes32 preRetVal) external { 
        (, bytes memory approveData) = abi.decode(context, (address, bytes));

        emit GSNTransactionProcessed(keccak256(approveData), success, actualCharge);
    }

}

