pragma solidity >=0.5.0 <0.6.0;
/**
 * @title IZkAssetOwnable
 * @author AZTEC
 * @dev An interface defining the ZkAssetOwnable standard 
 * 
 * Copyright 2020 Spilsbury Holdings Ltd 
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/

interface IZkAssetOwnable {

    /**
     * @dev Note owner can approve a third party address, such as a smart contract,
     * to spend multiple notes on their behalf. This allows a batch approval of notes
     * to be performed, rather than individually for each note via confidentialApprove(). 
     *
     * @param _noteHashes - array of the keccak256 hashes of notes, due to be spent
     * @param _spender - address being approved to spend the notes
     * @param _spenderApprovals - array of approvals, defining whether the _spender being approved or revoked permission
     * to spend the relevant note. True if approval granted, false if revoked
     * @param _batchSignature - ECDSA signature over the notes, approving them to be spent
     */
    function batchConfidentialApprove(
        bytes32[] calldata _noteHashes,
        address _spender,
        bool[] calldata _spenderApprovals,
        bytes calldata _batchSignature
    ) external;

    /**
    * @dev Note owner approving a third party, another address, to spend the note on
    * owner's behalf. This is necessary to allow the confidentialTransferFrom() method
    * to be called
    *
    * @param _noteHash - keccak256 hash of the note coordinates (gamma and sigma)
    * @param _spender - address being approved to spend the note
    * @param _spenderApproval - defines whether the _spender address is being approved to spend the
    * note, or if permission is being revoked. True if approved, false if not approved
    * @param _signature - ECDSA signature from the note owner that validates the
    * confidentialApprove() instruction
    */
    function confidentialApprove(
        bytes32 _noteHash,
        address _spender,
        bool _spenderApproval,
        bytes calldata _signature
    ) external;

    /**
    * @dev Executes a value transfer mediated by smart contracts. The method is supplied with
    * transfer instructions represented by a bytes _proofOutput argument that was outputted
    * from a proof verification contract.
    *
    * @param _proofId - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofOutput - output of a zero-knowledge proof validation contract. Represents
    * transfer instructions for the ACE
    */
    function confidentialTransferFrom(uint24 _proofId, bytes calldata _proofOutput) external;
    

    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofData - bytes variable outputted from a proof verification contract, representing
    * transfer instructions for the ACE
    * @param _signatures - array of the ECDSA signatures over all inputNotes
    */
    function confidentialTransfer(bytes calldata _proofData, bytes calldata _signatures) external;

    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofId - id of proof to be validated. Needs to be a balanced proof.
    * @param _proofData - bytes variable outputted from a proof verification contract, representing
    * transfer instructions for the ACE
    * @param _signatures - array of the ECDSA signatures over all inputNotes
    */
    function confidentialTransfer(uint24 _proofId, bytes calldata _proofData, bytes calldata _signatures) external;

    function isOwner() external view returns (bool);

    function owner() external returns (address);

    function renounceOwnership() external;

    /**
    * @dev Set which proofs this asset is able to listen to and validate
    * @param _epoch  epoch number to which the proof belongs
    * @param _proofs proofs for which the asset will listen to
    */
    function setProofs(
        uint8 _epoch,
        uint256 _proofs
    ) external;

    /**
    * @dev Return whether the proof is supported or not by this asset. Note that we have
    *     to subtract 1 from the proof id because the original representation is uint8,
    *     but here that id is considered to be an exponent
    *
    * @param _proof - unique identifier specifying the proof to be checked as to whether it is
    *                 supported by the asset
    * @return boolean defining whether the asset supports the proof specified by _proof input
    */
    function supportsProof(uint24 _proof) external view returns (bool);

    function transferOwnership(address newOwner) external;

    /**
    * @dev Update the metadata of a note that already exists in storage. 
    * @param noteHash - hash of a note, used as a unique identifier for the note
    * @param metaData - metadata to update the note with
    */
    function updateNoteMetaData(bytes32 noteHash, bytes calldata metaData) external;

    /**
    * @dev Upgrade the note registry of this asset, by pointing it to a new factory
    *
    * @param _factoryId - the ID of the factory which will supply the upgraded behaviour contracts
    */
    function upgradeRegistryVersion(uint24 _factoryId) external;

    event CreateZkAsset(
        address indexed aceAddress,
        address indexed linkedTokenAddress,
        uint256 scalingFactor,
        bool indexed _canAdjustSupply,
        bool _canConvert
    );

    event CreateNoteRegistry(uint256 noteRegistryId);

    event CreateNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);

    event DestroyNote(address indexed owner, bytes32 indexed noteHash);

    event ConvertTokens(address indexed owner, uint256 value);

    event RedeemTokens(address indexed owner, uint256 value);
    
    event UpdateNoteMetaData(address indexed owner, bytes32 indexed noteHash, bytes metadata);
}
