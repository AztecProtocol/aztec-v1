pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title Chargeable
* @author AZTEC
* @dev Allows gas fees for AZTEC proofs to be set
*
* Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
*/
contract Chargeable {
    using SafeMath for uint256;

    event SetGasCostForProof(uint24 indexed _proofId, uint256 _gasCost);
    event SetGasMultiplier(uint256 _multiplier);
    event TxFee(uint256 _txFee);

    mapping(uint24 => uint256) public proofGasCosts;

    uint256 public gasMultiplier = 0;
    uint256 public constant multiplierScalingFactor = 1000;

    /**
    * @dev Calculate and emit an event with the expected AZTEC fee
    */
    modifier fee(uint24 _proofId) {
        uint256 gasFee = getFeeForProof(_proofId);
        uint256 feeExpected = gasFee.mul(uint256(tx.gasprice));
        emit TxFee(feeExpected);
        require(msg.value >= feeExpected, "msg.value has insuficient associated fee");
        _;
    }

    /**
    * @dev Calculate the gas fee for a particular proof, specified by _proofId
    * @param _proofId unique identifier used to specify the proof for which the 
    * gas fee is being calculated
    * @return the gas fee for using the specified AZTEC proof
    */
    function getFeeForProof(uint24 _proofId) public view returns (uint256 gasFee) {
        uint256 gasCost = proofGasCosts[_proofId];
        gasFee = gasCost.mul(gasMultiplier).div(multiplierScalingFactor);
    }

    function setProofGasCost(uint24 _proofId, uint256 _gasCost) public;

    function setGasMultiplier(uint256 _multiplier) public;

    function withdraw(address payable _destination, uint256 _amount) public returns (bool);
}
