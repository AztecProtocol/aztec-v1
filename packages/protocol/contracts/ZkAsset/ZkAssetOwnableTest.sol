pragma solidity >=0.5.0 <0.6.0;

import "./ZkAssetOwnable.sol";

contract ZkAssetOwnableTest {

    ZkAssetOwnable public zkAssetOwnable;

    function setZkAssetOwnableAddress(address _zkAssetOwnableAddress) public {
        zkAssetOwnable = ZkAssetOwnable(_zkAssetOwnableAddress);
    } 

    function callConfidentialTransferApprove(uint24 _proof, bytes memory _proofOutput) public {
        // throws if not approval had not been given before
        zkAssetOwnable.confidentialTransferFrom(_proof, _proofOutput);
    }
}
