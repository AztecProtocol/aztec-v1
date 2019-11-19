pragma solidity >=0.5.0 <0.6.0;

import "../201907/Behaviour201907.sol";

/**
 * @title Behaviour201907
 * @author AZTEC
 * @dev Details the methods and the storage schema of a note registry.
        Is an ownable contract, and should always inherrit from the previous
        epoch of the behaviour contract. This contract defines the shared methods
        between all asset types for the 201907 generation (epoch 1).
 * Methods are documented in interface.
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract Behaviour201911 is Behaviour201907 {
    uint256 public constant slowReleaseEnd = 1580515200;
    bool public isAvailableDuringSlowRelease = false;

    function makeAvailable() public onlyOwner {
        require(isAvailableDuringSlowRelease == false, "asset is already available");
        isAvailableDuringSlowRelease = true;
    }
}
