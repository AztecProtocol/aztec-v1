pragma solidity >=0.5.0 <0.6.0;

import "./ZkAsset.sol";
import "../utils/ProofUtils.sol";

contract ZkAssetOwnable is ZkAsset {
    using ProofUtils for uint24;

    address public owner;
    mapping(uint8 => uint256) public proofs;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAsset(
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

    function confidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        supportsProof(_proof);
        super.confidentialTransferFrom(_proof, _proofOutput);
    }

    function supportsProof(uint24 _proof) public view returns (bool) {
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        require(category == uint8(ProofCategory.BALANCED), "this asset only supports balanced proofs");
        uint8 bit = uint8(proofs[epoch] >> id & 1);
        require(bit == 1, "expected proof to be supported");
        return bit == 1;
    }
}
