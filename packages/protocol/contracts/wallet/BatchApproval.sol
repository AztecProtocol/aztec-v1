pragma solidity >= 0.5.0 <0.7.0;

import "../ERC1724/ZkAssetMintable.sol";
import "../libs/NoteUtils.sol";
import "../interfaces/IZkAsset.sol";
import "../interfaces/IAZTEC.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Contract for approving a set of notes to be spent by another party. Simplifies flow for user by only needing to approve one transaction.
 * @author AZTEC
 */
contract BatchApproval is Ownable, IAZTEC {
    using NoteUtils for bytes;
    address public aceAddress;

    /**
     * @notice Constructor for this contract, simply saves the address of ACE
     * @param _aceAddress Address of ACE contract for use by this contract
     */
    constructor(address _aceAddress) public Ownable() {
        aceAddress = _aceAddress;
    }

    /**
     * @notice Check that all notes that have been passed to the contract are owned by it
     * @author AZTEC
     * @param _noteHashes An array of hashes of notes
     * @param _zkAsset The address of the zkAsset that minted these notes
     */
    modifier notesOwned(bytes32[] memory _noteHashes, address _zkAsset) {
        for (uint i = 0; i < _noteHashes.length; i++) {
            // (uint8 status, , , address noteOwner) = ACE(aceAddress).getNote(_zkAsset, _noteHashes[i]);
            // require(status == uint8(NoteStatus.UNSPENT));
            (, , , address noteOwner) = ACE(aceAddress).getNote(_zkAsset, _noteHashes[i]);
            require(noteOwner == address(this), "Contract does not own this note.");
        }
        _;
    }

    /**
     * @notice Allows user who owns this contract to approve a set of notes owned by this contract for spending by a party
     * @author AZTEC
     * @param _noteHashes An array of hashes of notes (that must be owned by this contract) to to be approved for spending
     * @param _zkAsset The address of the zkAsset that minted these notes
     * @param _spender The address of the person or contract that is being approved to spend these notes. Can be any person or contract e.g. Bob, a different third-party, a contract, this contract itself.
     */
    function batchApprove(bytes32[] memory _noteHashes, address _zkAsset, address _spender) public onlyOwner notesOwned(_noteHashes, _zkAsset) {
        IZkAsset asset = IZkAsset(_zkAsset);
        for (uint j = 0; j < _noteHashes.length; j++) {
            asset.confidentialApprove(_noteHashes[j], _spender, true, '');
        }
    }

    /**
     * @notice Validates a Join-Split proof to transfer notes to another addresstwo
     * @author AZTEC
     * @param _proof The proof data to verify
     * @param _zkAsset The address of the zkAsset
     * @param _sender The address sending the proof
     */
    function proofValidation(bytes memory _proof, address _zkAsset, address _sender) public onlyOwner {
        IZkAsset asset = IZkAsset(_zkAsset);
        (bytes memory _proofOutputs) = ACE(aceAddress).validateProof(JOIN_SPLIT_PROOF, _sender, _proof);
        asset.confidentialTransferFrom(JOIN_SPLIT_PROOF, _proofOutputs.get(0));
    }

    /**
     * @notice Approves notes and validates a Join-Split proof to transfer notes to another addresstwo
     * @author AZTEC
     * @param _noteHashes An array of hashes of notes (that must be owned by this contract) to to be approved for spending
     * @param _proof The proof data to verify
     * @param _zkAsset The address of the zkAsset
     * @param _spenderSender The address sending the proof
     */
    function spendNotes(bytes32[] memory _noteHashes, bytes memory _proof, address _zkAsset, address _spenderSender) public onlyOwner {
        batchApprove(_noteHashes, _zkAsset, _spenderSender);
        proofValidation(_proof, _zkAsset, _spenderSender);
    }
}