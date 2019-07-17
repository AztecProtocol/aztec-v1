pragma solidity >=0.5.0 <0.6.0;

import "../../../interfaces/Factory.sol";
import "./Behaviour.sol";
import "../Data.sol";

/**
 * @title NoteRegistryFactory contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev todo
 **/
contract FactoryConvertible201907 is NoteRegistryFactory {
    event NoteRegistryDeployed(address behaviourContract);

    function deployNewNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public
      returns (address)
    {
        Data201907 dataContract = new Data201907(
            _linkedTokenAddress,
            _scalingFactor,
            _canAdjustSupply,
            _canConvert
        );
        BehaviourConvert201907 behaviourContract = new BehaviourConvert201907(address(dataContract));
        dataContract.transferOwnership(address(behaviourContract));
        behaviourContract.transferOwnership(msg.sender);
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }

    function deployNewBehaviourInstance(
        address _dataContractAddress
    ) public
      returns (address)
    {
        BehaviourConvert201907 behaviourContract = new BehaviourConvert201907(_dataContractAddress);
        behaviourContract.transferOwnership(msg.sender);
        emit NoteRegistryDeployed(address(behaviourContract));
        return address(behaviourContract);
    }
}
