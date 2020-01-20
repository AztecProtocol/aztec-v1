pragma solidity >=0.5.0 <0.6.0;

import "../../ERC1724/ZkAssetOwnable.sol";

/**
 * @title ZkAssetOwnableTest
 * @author AZTEC
 * @dev Used for testing purposes
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAssetOwnableTest {

    ZkAssetOwnable public zkAssetOwnable;

    function setZkAssetOwnableAddress(address _zkAssetOwnableAddress) public {
        zkAssetOwnable = ZkAssetOwnable(_zkAssetOwnableAddress);
    }

    function callValidateProof(uint24 _proof, bytes memory _proofData) public {
        zkAssetOwnable.ace().validateProof(_proof, msg.sender, _proofData);
    }

    function callConfidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        // throws if not approval had not been given before
        zkAssetOwnable.confidentialTransferFrom(_proof, _proofOutput);
    }

    function callBatchConfidentialApprove(
        bytes32[] memory _noteHashes,
        address _spender,
        bool[] memory _spenderApprovals,
        bytes memory _batchSignature
    ) public {
        zkAssetOwnable.batchConfidentialApprove(_noteHashes, _spender, _spenderApprovals, _batchSignature);
    }
}
