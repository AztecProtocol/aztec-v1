pragma solidity >=0.5.0 <0.6.0;

import "./DividendComputationABIEncoder.sol";

/**
 * @title Dividend computation ABI Encoder Test
 * @author AZTEC
 * @dev Don't include this as an internal library. This contract uses a static memory table to cache
 * elliptic curve primitives and hashes.
 * Calling this internally from another function will lead to memory mutation and undefined behaviour.
 * The intended use case is to call this externally via `staticcall`.
 * External calls to OptimizedAZTEC can be treated as pure functions as this contract contains no
 * storage and makes no external calls (other than to precompiles)
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract DividendComputationABIEncoderTest {
    function validateDividendComputation(
        bytes calldata, 
        address, 
        uint[6] calldata
    ) 
        external 
        pure 
        returns (bytes memory) 
    {
        DividendComputationABIEncoder.encodeAndExit();
    }
}
