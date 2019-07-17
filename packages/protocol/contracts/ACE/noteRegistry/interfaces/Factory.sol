pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../../../interfaces/IAZTEC.sol";
import "../../../libs/NoteUtils.sol";
import "../../../libs/ProofUtils.sol";

/**
 * @title NoteRegistryFactory contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev todo
 **/
contract NoteRegistryFactory is IAZTEC {
    event NoteRegistryDeployed(address behaviourContract);

    function deployNewNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public returns (address);

    function deployNewBehaviourInstance(
        address _dataContractAddress
    ) public returns (address);
}
