

pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./ZkAsset.sol";
import "../ACE/ACE.sol";
import "../libs/LibEIP712.sol";
import "../libs/ProofUtils.sol";



contract ZkAssetMintable is ZkAsset {
    event UpdateTotalMinted(bytes32 noteHash, bytes noteData);
    
    address public owner;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canMintAndBurn,
        bool _canConvert
    ) public ZkAsset(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        _canMintAndBurn,
        _canConvert
    ) {
    }

    function confidentialMint(uint24 _proof, bytes calldata _proofData) external {
        require(_proofData.length != 0, "proof invalid");

        (bytes memory newTotalMinted, 
        bytes memory mintedNotes) = ace.mint(_proof, _proofData, address(this));

        (,
        bytes32 noteHash,
        bytes memory metadata) = newTotalMinted.extractNote();

        logOutputNotes(mintedNotes);
        emit UpdateTotalMinted(noteHash, metadata);
    }
}

