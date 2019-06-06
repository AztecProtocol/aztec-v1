pragma solidity >=0.5.0 <0.6.0;

import "./ACE.sol";
import "../MultiSig/MultiSigWalletWithTimeLock.sol";

/**
 * @title The ACE Owner
 * @author AZTEC
 * @dev /
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract ACEOwner is MultiSigWalletWithTimeLock {
    address public ace;

    constructor(
        address[] memory _owners,
        uint256 _required,
        uint256 _secondsTimeLocked
    ) public MultiSigWalletWithTimeLock(
        _owners,
        _required,
        _secondsTimeLocked
    ) {
        ace = address(new ACE());
    }
}
