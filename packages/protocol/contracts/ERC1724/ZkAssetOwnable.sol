pragma solidity >=0.5.0 <0.6.0;

import "./ZkAsset.sol";
import "../libs/ProofUtils.sol";
import "../libs/SafeMath8.sol";

/**
 * @title ZkAssetOwnable
 * @author AZTEC
 * @dev A contract which inherits from ZkAsset and includes the definition
 * of the contract owner
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract ZkAssetOwnable is ZkAsset {
    using ProofUtils for uint24;
    using SafeMath8 for uint8;
    
    address public owner;
    mapping(uint8 => uint256) public proofs;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public ZkAsset(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        _canAdjustSupply,
        _canConvert
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
        bool result = supportsProof(_proof);
        require(result == true, "expected proof to be supported");
        super.confidentialTransferFrom(_proof, _proofOutput);
    }

    // @dev Return whether the proof is supported or not by this asset. Note that we have
    //      to subtract 1 from the proof id because the original representation is uint8,
    //      but here that id is considered to be an exponent
    function supportsProof(uint24 _proof) public view returns (bool) {
        (uint8 epoch, uint8 category, uint8 id) = _proof.getProofComponents();
        require(category == uint8(ProofCategory.BALANCED), "this asset only supports balanced proofs");
        uint8 bit = uint8(proofs[epoch] >> (id.sub(1)) & 1);
        return bit == 1;
    }
}
