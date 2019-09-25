pragma solidity >=0.5.0 <0.6.0;

import "../../ACE/ACE.sol";

/**
 * @title ACETest
 * @author AZTEC
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract ACETest {
    event DebugValidateProofs(bytes proofOutputs);

    ACE public ace;

    function setACEAddress(address _aceAddress) public {
        ace = ACE(_aceAddress);
    }

    function validateProof(
        uint24 _proof,
        address _sender,
        bytes memory _proofData
    ) public returns (bytes memory) {
        bytes memory proofOutputs = ace.validateProof(_proof, _sender, _proofData);
        emit DebugValidateProofs(proofOutputs);
    }
}
