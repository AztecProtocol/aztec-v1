pragma solidity >= 0.5.0 <0.7.0;

import "../ERC1724/ZkAssetMintable.sol";
import "../libs/NoteUtils.sol";
import "../libs/LibEIP712.sol";
import "../interfaces/IZkAsset.sol";
import "../interfaces/IAZTEC.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Contract for approving a set of notes to be
 *        spent by another party. Simplifies flow for
 *        user by only needing to approve one transaction.
 * @author AZTEC
 */
contract Wallet is Ownable, IAZTEC, LibEIP712 {
    using NoteUtils for bytes;
    address public aceAddress;

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "WALLET";

    // EIP712 Domain Version value
    string constant internal EIP712_DOMAIN_VERSION = "1";

    bytes32 constant internal MULTIPLE_NOTE_SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(
        "MultipleNoteSignature(",
            "bytes32[] noteHashes,",
            "address spender,",
            "bool status",
        ")"
    ));

    /**
     * @notice Constructor for this contract, simply saves the address of ACE and the domain hash
     * @param _aceAddress Address of ACE contract for use by this contract
     */
    constructor(address _aceAddress) public Ownable() {
        aceAddress = _aceAddress;
        EIP712_DOMAIN_HASH = keccak256(abi.encode(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            address(this)
        ));
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
            require(noteOwner == address(this), "contract does not own this note.");
        }
        _;
    }

    /**
     * @notice Allows user who owns this contract to approve
     *         a set of notes owned by this contract for
     *         spending by a party
     * @author AZTEC
     * @param _noteHashes An array of hashes of notes (that must be owned
     *                    by this contract) to to be approved for spending
     * @param _spender The address of the person or contract that is
     *                 being approved to spend these notes. Can be
     *                 any person or contract e.g. Bob, a different
     *                 third-party, a contract, this contract itself.
     * @param _status Bool representing whether approval is being
     *                granted (true) or revoked (false)
     * @param _zkAsset The address of the zkAsset that minted these notes
     */
    function batchConfidentialApprove(
        bytes32[] memory _noteHashes,
        address _spender,
        bool _status,
        address _zkAsset
    ) public onlyOwner notesOwned(_noteHashes, _zkAsset) {
        IZkAsset asset = IZkAsset(_zkAsset);
        for (uint j = 0; j < _noteHashes.length; j++) {
            asset.confidentialApprove(_noteHashes[j], _spender, _status, '');
        }
    }

    /**
     * @notice Validates a Join-Split proof to transfer notes to another address
     * @author AZTEC
     * @param _proof The proof data to verify
     * @param _zkAsset The address of the zkAsset
     * @param _sender The address sending the proof
     */
    function batchConfidentialTransfer(
        bytes memory _proof,
        address _zkAsset,
        address _sender
    ) public onlyOwner {
        IZkAsset asset = IZkAsset(_zkAsset);
        (bytes memory _proofOutputs) = ACE(aceAddress).validateProof(JOIN_SPLIT_PROOF, _sender, _proof);
        asset.confidentialTransferFrom(JOIN_SPLIT_PROOF, _proofOutputs.get(0));
    }


    // TODO: decide whether this function neccesary
    /**
     * @notice Approves notes and validates a Join-Split proof to transfer notes to another address
     * @author AZTEC
     * @param _noteHashes An array of hashes of notes (that
                          must be owned by this contract) to
                          to be approved for spending
     * @param _proof The proof data to verify
     * @param _zkAsset The address of the zkAsset
     * @param _spenderSender The address sending the proof (also the address that is spending the notes)
     */
    function spendNotes(
        bytes32[] memory _noteHashes,
        bytes memory _proof,
        address _zkAsset,
        address _spenderSender
    ) public onlyOwner {
        batchConfidentialApprove(_noteHashes, _spenderSender, true, _zkAsset);
        batchConfidentialTransfer(_proof, _zkAsset, _spenderSender);
    }

    /**
    * @dev Perform ECDSA signature validation for a signature over an array of input notes
    * @param _noteHashes Array of keccak256 hashes of the note array coordinates (gamma and sigma)
    * @param _spender The address of the person or contract that is
    *                 being approved to spend these notes. Can be
    *                 any person or contract e.g. Bob, a different
    *                 third-party, a contract, this contract itself.
    * @param _status Boolean of whether the notes are being approved
                     to spend or if approval is being revoked
    * @param _signature ECDSA signature for a particular array of input notes
    * @param _zkAsset The address of the zkAsset
    */
    function batchValidateSignature(
        bytes32[] memory _noteHashes,
        address _spender,
        bool _status,
        bytes memory _signature,
        address _zkAsset
    ) public view notesOwned(_noteHashes, _zkAsset) {
        bytes32 _hashStruct = keccak256(abi.encode(
            MULTIPLE_NOTE_SIGNATURE_TYPEHASH,
            keccak256(abi.encode(_noteHashes)),
            _spender,
            _status
        ));
        // validate EIP712 signature
        bytes32 msgHash = hashEIP712Message(_hashStruct);
        address signer = recoverSignature(
            msgHash,
            _signature
        );
        require(signer == owner(), "the contract owner did not sign this message");
    }
}
