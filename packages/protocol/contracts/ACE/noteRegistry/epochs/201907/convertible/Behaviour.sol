pragma solidity >=0.5.0 <0.6.0;

import "../Data.sol";
import "../../../Manager.sol";
import "../../../interfaces/Behaviour.sol";

/**
 * @title NoteRegistryBehaviour contract which contains the storage variables that define the set of valid
 * AZTEC notes for a particular address
 * @author AZTEC
 * @dev TODO
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/
contract BehaviourConvert201907 is NoteRegistryBehaviour {

    constructor (address _noteRegistryData) public {
        noteRegistryData = NoteRegistryData(_noteRegistryData);
        isActiveBehaviour = true;
    }

    function transferDataContract(address _newOwner) public onlyOwner {
        noteRegistryData.transferOwnership(_newOwner);
        isActiveBehaviour = false;
    }

    /**
    * @dev Call transferFrom on a linked ERC20 token. Used in cases where the ACE's mint
    * function is called but the token balance of the note registry in question is
    * insufficient
    *
    * @param _value the value to be transferred
    */
    function supplementTokens(uint256 _value) external {
        noteRegistryData.incrementTotalSupply(_value);
    }

    /**
    * @dev Burn AZTEC notes
    * TODO
    */
    function burn(bytes calldata _proofOutputs) external onlyOwner {
        (
            ,,,,
            bytes32 confidentialTotalBurned,
            ,
            bool canAdjustSupply
        ) = getRegistry();
        require(canAdjustSupply == true, "this asset is not burnable");
        // Dealing with notes representing totals
        (bytes memory oldTotal, // input notes
        bytes memory newTotal, // output notes
        ,
        ) = _proofOutputs.get(0).extractProofOutput();

        // Dealing with burned notes
        (,
        bytes memory burnedNotes,
        ,) = _proofOutputs.get(1).extractProofOutput();

        (, bytes32 oldTotalNoteHash, ) = oldTotal.get(0).extractNote();
        require(oldTotalNoteHash == confidentialTotalBurned, "provided total burned note does not match");
        (, bytes32 newTotalNoteHash, ) = newTotal.get(0).extractNote();
        setConfidentialTotalBurned(newTotalNoteHash);

        // Although they are outputNotes, they are due to be destroyed - need removing from the note registry
        updateInputNotes(burnedNotes);
    }

        /**
    * @dev Mint AZTEC notes
    * TODO
    */
    function mint(bytes calldata _proofOutputs) external onlyOwner {
        (
            ,,,
            bytes32 confidentialTotalMinted,
            ,,
            bool canAdjustSupply
        ) = getRegistry();
        require(canAdjustSupply == true, "this asset is not mintable");
        // Dealing with notes representing totals
        (bytes memory oldTotal, // input notes
        bytes memory newTotal, // output notes
        ,
        ) = _proofOutputs.get(0).extractProofOutput();

        // Dealing with burned notes
        (,
        bytes memory mintedNotes,
        ,) = _proofOutputs.get(1).extractProofOutput();

        (, bytes32 oldTotalNoteHash, ) = oldTotal.get(0).extractNote();
        require(oldTotalNoteHash == confidentialTotalMinted, "provided total burned note does not match");
        (, bytes32 newTotalNoteHash, ) = newTotal.get(0).extractNote();
        setConfidentialTotalMinted(newTotalNoteHash);

        updateOutputNotes(mintedNotes);
    }

    /**
    * @dev Update the state of the note registry according to transfer instructions issued by a 
    * zero-knowledge proof
    *
    * @param _proof - unique identifier for a proof
    * @param _proofOutput - transfer instructions issued by a zero-knowledge proof
    * @param _proofSender - address of the entity sending the proof
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput,
        address _proofSender
    ) public onlyOwner {
        (
            bool active,
            address linkedToken,
            uint256 scalingFactor,
            ,,,,
            bool canConvert,
        ) = noteRegistryData.registry();
        require(active == true, "note registry does not exist for the given address");
        bytes32 proofHash = keccak256(_proofOutput);

        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();

        updateInputNotes(inputNotes);
        updateOutputNotes(outputNotes);

        // If publicValue != 0, enact a token transfer
        // (publicValue < 0) => transfer from publicOwner to ACE
        // (publicValue > 0) => transfer from ACE to publicOwner
        if (publicValue != 0) {
            require(canConvert == true, "asset cannot be converted into public tokens");

            if (publicValue < 0) {
                uint256 approvalForAddressForHash = noteRegistryData.getPublicApproval(publicOwner, proofHash);
                noteRegistryData.incrementTotalSupply(uint256(-publicValue));
                require(
                    approvalForAddressForHash >= uint256(-publicValue),
                    "public owner has not validated a transfer of tokens"
                );

                noteRegistryData.createPublicApproval(publicOwner, proofHash, approvalForAddressForHash.sub(uint256(-publicValue)));
                NoteRegistryManager(owner()).transferFrom(
                    publicOwner,
                    address(owner()),
                    uint256(-publicValue).mul(scalingFactor));
            } else {
                noteRegistryData.decrementTotalSupply(uint256(publicValue));
                NoteRegistryManager(owner()).transferFrom(
                    address(owner()),
                    publicOwner,
                    uint256(publicValue).mul(scalingFactor));
            }
        }
    }

    /**
    * @dev This should be called from an asset contract.
    */
    function publicApprove(address _publicOwner, bytes32 _proofHash, uint256 _value) public onlyOwner {
        noteRegistryData.createPublicApproval(_publicOwner, _proofHash, _value);
    }

    function setConfidentialTotalMinted(bytes32 newTotalNoteHash) internal onlyOwner returns (bytes32) {
        noteRegistryData.setConfidentialTotalMinted(newTotalNoteHash);
        return newTotalNoteHash;
    }

    function setConfidentialTotalBurned(bytes32 newTotalNoteHash) internal onlyOwner returns (bytes32) {
        noteRegistryData.setConfidentialTotalBurned(newTotalNoteHash);
        return newTotalNoteHash;
    }

    /**
     * @dev Returns the registry for a given address.
     *
     * @return linkedTokenAddress - public ERC20 token that is linked to the NoteRegistry. This is used to
     * transfer public value into and out of the system
     * @return scalingFactor - defines how many ERC20 tokens are represented by one AZTEC note
     * @return totalSupply - TODO
     * @return confidentialTotalMinted - keccak256 hash of the note representing the total minted supply
     * @return confidentialTotalBurned - keccak256 hash of the note representing the total burned supply
     * @return canConvert - flag set by the owner to decide whether the registry has public to private, and
     * vice versa, conversion privilege
     * @return canAdjustSupply - determines whether the registry has minting and burning privileges
     */
    function getRegistry() public view returns (
        address linkedToken,
        uint256 scalingFactor,
        uint256 totalSupply,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        bool canConvert,
        bool canAdjustSupply
    ) {
        bool active;
        (
            active,
            linkedToken,
            scalingFactor,
            totalSupply,
            confidentialTotalMinted,
            confidentialTotalBurned,
            ,
            canConvert,
            canAdjustSupply
        ) = noteRegistryData.registry();
        require(active == true, "expected registry to be created");
    }

    /**
     * @dev Returns the note for a given address and note hash.
     *
     * @param _noteHash - keccak256 hash of the note coordiantes (gamma and sigma)
     * @return status - status of the note, details whether the note is in a note registry
     * or has been destroyed
     * @return createdOn - time the note was created
     * @return destroyedOn - time the note was destroyed
     * @return noteOwner - address of the note owner
     */
    function getNote(bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    ) {
        (
            status,
            createdOn,
            destroyedOn,
            noteOwner
        ) = noteRegistryData.getNote(_noteHash);
    }

    /**
     * @dev Removes input notes from the note registry
     *
     * @param inputNotes - an array of input notes from a zero-knowledge proof, that are to be
     * removed and destroyed from a note registry
     */
    function updateInputNotes(bytes memory inputNotes) internal {
        uint256 length = inputNotes.getLength();

        for (uint256 i = 0; i < length; i += 1) {
            (address noteOwner, bytes32 noteHash,) = inputNotes.get(i).extractNote();
            noteRegistryData.deleteNote(noteHash, noteOwner);

        }
    }

    /**
     * @dev Adds output notes to the note registry
     *
     * @param outputNotes - an array of output notes from a zero-knowledge proof, that are to be
     * added to the note registry
     */
    function updateOutputNotes(bytes memory outputNotes) internal {
        uint256 length = outputNotes.getLength();

        for (uint256 i = 0; i < length; i += 1) {
            (address noteOwner, bytes32 noteHash,) = outputNotes.get(i).extractNote();
            require(noteOwner != address(0x0), "output note owner cannot be address(0x0)");
            noteRegistryData.createNote(noteHash, noteOwner);
        }
    }
}
