pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "../interfaces/IAZTEC.sol";
import "../ACE/ACE.sol" as ACEModule;
import "../libs/NoteUtils.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/IZkAsset.sol";

contract TransactionRelayer is IAZTEC, Initializable {
    using NoteUtils for bytes;

    ACEModule.ACE ace;

    function initialize(address _ace) public initializer {
        ace = ACEModule.ACE(_ace);
    }

    function deposit(
        address _registryOwner,
        bytes32 _proofHash,
        bytes memory _proofData,
        uint256 _value
    ) public {
        (address linkedTokenAddress,,,,,,,) = ace.getRegistry(_registryOwner);
        IERC20Mintable linkedToken = IERC20Mintable(linkedTokenAddress);

        linkedToken.transferFrom(
            msg.sender,
            address(this),
            _value
        );

        linkedToken.approve(address(ace), _value);

        ace.publicApprove(_registryOwner, _proofHash, _value);

        bytes memory proofOutputs = ace.validateProof(
            JOIN_SPLIT_PROOF,
            address(this),
            _proofData
        );

        IZkAsset(_registryOwner).confidentialTransferFrom(
            JOIN_SPLIT_PROOF,
            proofOutputs.get(0)
        );
    }
}
