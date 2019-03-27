pragma solidity >=0.5.0 <0.6.0;

import "./ZkAsset.sol";

contract ZkAssetDetailed is ZkAsset {

    string public name;
    string public symbol;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        string memory _name,
        string memory _symbol
    ) public ZkAsset(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor
    ) {
        name = _name;
        symbol = _symbol;
    }
}
