pragma solidity >=0.5.0 <0.6.0;

import "./ZkAsset.sol";

contract ZkAssetOwnable is ZkAsset {
    
    address public owner;
    mapping(uint8 => uint256) proofs;

    constructor(
        string memory _name,
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAsset(
        _name,
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor
    ) {
        owner = msg.sender;
    }

    function setProofs(
        uint8 _epoch,
        uint256 _proofs
    ) external {
        require(msg.sender == owner, "only the owner can set the epoch proofs");
        proofs[_epoch] = _proofs;
    }
    
    // function confidentialTransfer(bytes calldata _proofData) external returns (bool) {

    // }

    // function confidentialTransferFrom(uint24 _proof, bytes calldata _proofOutput) external returns (bool) {

    // }

    // function confidentialApprove(
    //     bytes32 _noteHash,
    //     address _spender,
    //     bool _status,
    //     bytes memory _signature
    // ) public returns (bool) {

    // }

    // function supportsProof(uint24 _proof) public view returns (bool) {
    //     (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
    //     require(proofs[epoch] == true, "expected epoch to be supported");
    //     require(category == uint8(ProofCategory.BALANCED), "ZkAsset only supports balanced proofs");
    //     return proofs[epoch][id];
    // }
}
