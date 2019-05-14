pragma solidity >=0.5.0 <0.6.0;

import "../libs/LibEIP712.sol";

/**
 * @title AdjustSupplyInterface
 * @author AZTEC
 * @dev An interface defining the AdjustSupplyInterface standard.
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
interface AdjustSupplyInterface {
    /* solhint-disable-next-line var-name-mixedcase */

    function validateAdjustSupply(
        bytes calldata,
        address,
        uint[6] calldata
    ) external pure returns (bytes memory);
}
