pragma solidity >=0.5.0 <0.6.0;

import "../../../../../interfaces/IAZTEC.sol";
import "../../../../../libs/NoteUtils.sol";
import "../Behaviour201911.sol";
import "../../201907/base/BehaviourBase201907.sol";

/**
 * @title BehaviourBase201911
 * @author AZTEC
 * @dev This contract extends Behaviour201911 and BehaviourBase201907.
        Methods are documented in interface.
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract BehaviourBase201911 is Behaviour201911, BehaviourBase201907 {
    constructor () BehaviourBase201907() public {}
}
