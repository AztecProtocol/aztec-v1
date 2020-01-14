pragma solidity >=0.5.0 <0.6.0;
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@aztec/protocol/contracts/interfaces/IAZTEC.sol";
import "@aztec/protocol/contracts/ACE/ACE.sol" as ACEModule;
import "@aztec/protocol/contracts/libs/NoteUtils.sol";
import "@aztec/protocol/contracts/interfaces/IERC20.sol";
import "@aztec/protocol/contracts/interfaces/IZkAsset.sol";
import "./AZTECAccountRegistry.sol";

contract TransactionRelayer is Context, IAZTEC, AZTECAccountRegistry {
    using NoteUtils for bytes;

    ACEModule.ACE ace;

    constructor(
        address _ace
    ) public {
        ace = ACEModule.ACE(_ace);
    }

    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes memory _proofData,
        uint256 _value
    ) public {
        bytes memory proofOutputs = ace.validateProof(
            JOIN_SPLIT_PROOF,
            address(this),
            _proofData
        );

        if (_owner != _msgSender()) {
            require(accountAliasMapping[_owner] == _msgSender(), "Sender has no permission to deposit on owner's behalf.");

            (,
            bytes memory proofOutputNotes,
            ,
            ) = proofOutputs.get(0).extractProofOutput();
            uint256 numberOfNotes = proofOutputNotes.getLength();
            for (uint256 i = 0; i < numberOfNotes; i += 1) {
                (address owner,,) = proofOutputNotes.get(i).extractNote();
                require(owner == _owner, "Cannot deposit note to other account if sender is not the same as owner.");
            }
        }

        (address linkedTokenAddress,,,,,,,) = ace.getRegistry(_registryOwner);
        IERC20 linkedToken = IERC20(linkedTokenAddress);

        linkedToken.transferFrom(
            _owner,
            address(this),
            _value
        );

        linkedToken.approve(address(ace), _value);

        ace.publicApprove(_registryOwner, _proofHash, _value);

        IZkAsset(_registryOwner).confidentialTransferFrom(
            JOIN_SPLIT_PROOF,
            proofOutputs.get(0)
        );
    }
}
