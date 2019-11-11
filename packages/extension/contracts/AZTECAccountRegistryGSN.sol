pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/bouncers/GSNBouncerSignature.sol";

import "@aztec/protocol/contracts/interfaces/IZkAsset.sol";
import "@aztec/protocol/contracts/libs/LibEIP712.sol";
import "./AZTECAccountRegistry.sol";

/**
 * @title AZTECAccountRegistryGSN implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract AZTECAccountRegistryGSN is LibEIP712, AZTECAccountRegistry, GSNRecipient, GSNBouncerSignature {

    constructor(
        address _trustedAddress
    ) public {
        GSNRecipient.initialize();
        GSNBouncerSignature.initialize(_trustedAddress);
    }

    function confidentialTransferFrom(address _registryOwner, uint24 _proof, bytes memory _proofOutput) public {
        IZkAsset(_registryOwner).confidentialTransferFrom(_proof, _proofOutput);
    }

}

