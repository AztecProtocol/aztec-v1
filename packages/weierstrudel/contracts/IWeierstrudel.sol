pragma solidity 0.5.0;

interface IWeierstrudel {
    function() external payable;
}

library LWeierstrudel {
    function test() external returns (uint r) { r = 1000; }
}

contract WeierstrudelCaller {
    event Point(bytes32 x, bytes32 y, bytes32 z);

    constructor() public payable {}

    function ecBatchMul(uint[2][] calldata, uint[] calldata) external returns (
        bytes32 x,
        bytes32 y,
        bytes32 z
    ) {
        bool result;
        assembly {
            let memPtr := mload(0x40)
            let numPoints := calldataload(0x44)
            let numScalars := calldataload(add(calldataload(0x24), 0x04))
            if sub(numPoints, numScalars) {
                revert(0x00, 0x00)
            }
            calldatacopy(memPtr, 0x64, mul(numPoints, 0x40))
            calldatacopy(add(memPtr, mul(numPoints, 0x40)), add(calldataload(0x24), 0x24), mul(numPoints, 0x20))
            result := call(gas, LWeierstrudel, 0x01, memPtr, mul(numPoints, 0x60), memPtr, 0x60)
            result := 0x01
            x := mload(memPtr)
            y := mload(add(memPtr, 0x20))
            z := mload(add(memPtr, 0x40))
        
        }
        require(result, "call to Weierstrudel failed?");
        emit Point(x, y, z);
    }
}
