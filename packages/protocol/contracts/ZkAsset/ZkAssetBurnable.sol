

pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./ZkAsset.sol";
import "../ACE/ACE.sol";
import "../libs/LibEIP712.sol";
import "../libs/ProofUtils.sol";

contract ZkAssetBurnable is ZkAsset {
    event UpdateTotalBurned(bytes32 noteHash, bytes noteData);
    event CompletedBurn(bool result);
    
    address public owner;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canMint,
        bool _canBurn,
        bool _canConvert
    ) public ZkAsset(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        _canMint,
        _canBurn,
        _canConvert
    ) {
        owner = msg.sender;
    }

    function confidentialBurn(uint24 _proof, bytes calldata _proofData) external {
        require(_proofData.length != 0, "proof invalid");

        (bytes memory outputNotesTotal, 
        bytes memory outputNotes) = ace.burn(_proof, _proofData, address(this));
        emit CompletedBurn(true);

        (address owner,
        bytes32 noteHash,
        bytes memory metadata) = outputNotesTotal.extractNote();

        logOutputNotes(outputNotes);
        emit UpdateTotalBurned(noteHash, metadata);
    }
}


