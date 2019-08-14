pragma solidity >=0.5.0 <0.6.0;

import "../../../../../interfaces/IAZTEC.sol";
import "../../../../../libs/NoteUtils.sol";
import "../Behaviour201907.sol";

/**
 * @title BehaviourConvertible201907
 * @author AZTEC
 * @dev This contract extends Behaviour201907, to add methods which enable public/private conversion.
        Methods are documented in interface.
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract BehaviourConvertible201907 is Behaviour201907 {
    constructor () Behaviour201907() public {}
}
