pragma solidity >=0.5.0 <0.6.0;
import "@aztec/protocol/contracts/interfaces/IAZTEC.sol";
import "@aztec/protocol/contracts/ACE/ACE.sol" as ACEModule;
import "@aztec/protocol/contracts/libs/NoteUtils.sol";
import "@aztec/protocol/contracts/interfaces/IERC20.sol";
import "@aztec/protocol/contracts/interfaces/IZkAsset.sol";

contract TransactionRelayer is IAZTEC {
    using NoteUtils for bytes;

    ACEModule.ACE ace;

    constructor(
        address _ace
    ) public {
        ace = ACEModule.ACE(_ace);
    }

    function deposit(
        address _registryOwner,
        bytes32 _proofHash,
        bytes memory _proofData,
        uint256 _value
    ) public {
        (address linkedTokenAddress,,,,,,,) = ace.getRegistry(_registryOwner);
        IERC20 linkedToken = IERC20(linkedTokenAddress);

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
