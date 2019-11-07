pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/bouncers/GSNBouncerSignature.sol";


import "../interfaces/IZkAsset.sol";
import "../libs/LibEIP712.sol";
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

    function confidentialTransfer(address _registryOwner, bytes memory _proofData, bytes memory _signatures) public {
        IZkAsset(_registryOwner).confidentialTransfer(_proofData, _signatures);
    }
}
