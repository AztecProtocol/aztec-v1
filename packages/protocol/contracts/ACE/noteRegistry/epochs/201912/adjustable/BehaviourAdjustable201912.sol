pragma solidity >=0.5.0 <0.6.0;

import "../../../../../interfaces/IAZTEC.sol";
import "../../../../../libs/NoteUtils.sol";
import "../Behaviour201912.sol";
import "../../201911/adjustable/BehaviourAdjustable201911.sol";

/**
 * @title BehaviourBase201912
 * @author AZTEC
 * @dev This contract extends Behaviour201912.
        Methods are documented in interface.
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract BehaviourAdjustable201912 is Behaviour201912, BehaviourAdjustable201911 {
    constructor () BehaviourAdjustable201911() public {}

    function burn(bytes memory _proofOutputs) public onlyOwner {
        super.burn(_proofOutputs);
    }

    function mint(bytes memory _proofOutputs) public onlyOwner {
        super.mint(_proofOutputs);
    }
}
