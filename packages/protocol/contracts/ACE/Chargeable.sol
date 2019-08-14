pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Chargeable {
    using SafeMath for uint256;

    event SetGasCostForProof(uint24 indexed _proofId, uint256 _gasCost);
    event SetGasMultiplier(uint256 _multiplier);
    event TxFee(uint256 _txFee);

    mapping(uint24 => uint256) public proofGasCosts;

    uint256 public gasMultiplier = 0;
    uint256 public constant multiplierScalingFactor = 1000;

    modifier fee(uint24 _proofId) {
        uint256 gasFee = getFeeForProof(_proofId);
        uint256 feeExpected = gasFee.mul(uint256(tx.gasprice));
        emit TxFee(feeExpected);
        require(msg.value >= feeExpected, "msg.value has insuficient associated fee");
        _;
    }

    function getFeeForProof(uint24 _proofId) public view returns (uint256 gasFee) {
        uint256 gasCost = proofGasCosts[_proofId];
        gasFee = gasCost.mul(gasMultiplier).div(multiplierScalingFactor);
    }

    function setProofGasCost(uint24 _proofId, uint256 _gasCost) public;

    function setGasMultiplier(uint256 _multiplier) public;

    function withdraw(address payable _destination, uint256 _amount) public returns (bool);
}