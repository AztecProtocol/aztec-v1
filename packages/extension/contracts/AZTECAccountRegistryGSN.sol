pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/bouncers/GSNBouncerSignature.sol";
import "@aztec/protocol/contracts/libs/NoteUtils.sol";


import "../interfaces/IZkAsset.sol";
import "../interfaces/IACE.sol" as IACEModule;
import "../interfaces/IERC20.sol";
import "../interfaces/IAZTEC.sol";
import "../libs/LibEIP712.sol";
import "./AZTECAccountRegistry.sol";

/**
 * @title AZTECAccountRegistryGSN implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract AZTECAccountRegistryGSN is LibEIP712, IAZTEC, AZTECAccountRegistry, GSNRecipient, GSNBouncerSignature {

    IACEModule.IACE ace;

    using NoteUtils for bytes;
    constructor(
        address _ace,
        address _trustedAddress
    ) public {
        GSNRecipient.initialize();
        GSNBouncerSignature.initialize(_trustedAddress);
        ace = IACEModule.IACE(_ace);
    }

    function confidentialTransferFrom(address _registryOwner, bytes memory _proofData) public {
        (bytes memory proofOutputs) = ace.validateProof(JOIN_SPLIT_PROOF, address(this), _proofData);
        IZkAsset(_registryOwner).confidentialTransferFrom(JOIN_SPLIT_PROOF, proofOutputs.get(0));
    }

    function approve(address _erc20, address spender, uint256 value) public {
        IERC20(_erc20).approve(spender, value);
    }
}

