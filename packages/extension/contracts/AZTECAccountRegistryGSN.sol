pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol"; 
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipientSignature.sol";

import "@aztec/protocol/contracts/libs/NoteUtils.sol";
import "@aztec/protocol/contracts/interfaces/IZkAsset.sol";
import "@aztec/protocol/contracts/interfaces/IERC20.sol";
import "@aztec/protocol/contracts/interfaces/IAZTEC.sol";
import "@aztec/protocol/contracts/ACE/ACE.sol" as ACEModule;
import "./AZTECAccountRegistry.sol";


/**
 * @title AZTECAccountRegistryGSN implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract AZTECAccountRegistryGSN is IAZTEC, AZTECAccountRegistry, GSNRecipient, GSNRecipientSignature {

    using NoteUtils for bytes;
    ACEModule.ACE ace;
    uint24 public constant JOIN_SPLIT_PROOF = 65793;
    constructor(
        address _ace,
        address _trustedAddress
    ) public {
        GSNRecipient.initialize();
        GSNRecipientSignature.initialize(_trustedAddress);
        ace = ACEModule.ACE(_ace);
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


                                     // function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) public {
                                     //     ace.publicApprove(_registryOwner, _proofHash, _value);
                                     // }
}



