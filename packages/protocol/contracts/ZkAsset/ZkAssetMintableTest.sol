pragma solidity >=0.5.0 <0.6.0;

import "./ZkAssetMintable.sol";

/**
 * @title ZkAssetMintableTest
 * @author AZTEC 
 * @dev Used for testing purposes
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAssetMintableTest {

    ZkAssetMintable public zkAssetMintable;

    function setZkAssetMintableAddress(address _zkAssetMintableAddress) public {
        zkAssetMintable = ZkAssetMintable(_zkAssetMintableAddress);
    } 

    function callValidateProof(uint24 _proof, bytes memory _proofData) public {
        zkAssetMintable.ace().validateProof(_proof, msg.sender, _proofData);
    }

    function callConfidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        // throws if not approval had not been given before
        zkAssetMintable.confidentialTransferFrom(_proof, _proofOutput);
    }
}
