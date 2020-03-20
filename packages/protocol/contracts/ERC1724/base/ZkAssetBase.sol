pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../../libs/NoteUtils.sol";
import "../../interfaces/IACE.sol";
import "../../interfaces/IAZTEC.sol";
import "../../interfaces/IZkAsset.sol";
import "../../interfaces/IERC20Mintable.sol";
import "../../libs/LibEIP712.sol";
import "../../libs/MetaDataUtils.sol";
import "../../libs/ProofUtils.sol";

/**
 * @title ZkAssetBase
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a confidential asset.
 * The ownership values and transfer values are encrypted.
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
contract ZkAssetBase is IZkAsset, IAZTEC, LibEIP712 {
    using NoteUtils for bytes;
    using SafeMath for uint256;
    using ProofUtils for uint24;

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "ZK_ASSET";

    bytes32 constant internal PROOF_SIGNATURE_TYPE_HASH = keccak256(abi.encodePacked(
        "ProofSignature(",
            "bytes32 proofHash,",
            "address spender,",
            "bool approval",
        ")"
    ));
    string private constant EIP712_DOMAIN  = "EIP712Domain(string name,string version,address verifyingContract)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 constant internal NOTE_SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(
        "NoteSignature(",
            "bytes32 noteHash,",
            "address spender,",
            "bool spenderApproval",
        ")"
    ));

    bytes32 constant internal JOIN_SPLIT_SIGNATURE_TYPE_HASH = keccak256(abi.encodePacked(
        "JoinSplitSignature(",
            "uint24 proof,",
            "bytes32 noteHash,",
            "uint256 challenge,",
            "address sender",
        ")"
    ));

    IACE public ace;
    IERC20Mintable public linkedToken;

    mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
    mapping(bytes32 => uint256) public metaDataTimeLog;
    mapping(bytes32 => uint256) public noteAccess;
    mapping(bytes32 => bool) public signatureLog;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply
    ) public {
        bool canConvert = (_linkedTokenAddress == address(0x0)) ? false : true;
        EIP712_DOMAIN_HASH = keccak256(abi.encodePacked(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            bytes32(uint256(address(this)))
        ));
        ace = IACE(_aceAddress);
        linkedToken = IERC20Mintable(_linkedTokenAddress);
        ace.createNoteRegistry(
            _linkedTokenAddress,
            _scalingFactor,
            _canAdjustSupply,
            canConvert
        );
        emit CreateZkAsset(
            _aceAddress,
            _linkedTokenAddress,
            _scalingFactor,
            _canAdjustSupply,
            canConvert
        );
    }

    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofId - id of proof to be validated. Needs to be a balanced proof.
    * @param _proofData - bytes variable outputted from a proof verification contract, representing
    * transfer instructions for the IACE
    * @param _signatures - array of the ECDSA signatures over all inputNotes
    */
    function confidentialTransfer(uint24 _proofId, bytes memory _proofData, bytes memory _signatures) public {
        // Check that it's a balanced proof
        (, uint8 category, ) = _proofId.getProofComponents();

        require(category == uint8(ProofCategory.BALANCED), "this is not a balanced proof");
        bytes memory proofOutputs = ace.validateProof(_proofId, msg.sender, _proofData);
        confidentialTransferInternal(_proofId, proofOutputs, _signatures, _proofData);
    }

    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofData - bytes variable outputted from a proof verification contract, representing
    * transfer instructions for the IACE
    * @param _signatures - array of the ECDSA signatures over all inputNotes
    */
    function confidentialTransfer(bytes memory _proofData, bytes memory _signatures) public {
        confidentialTransfer(JOIN_SPLIT_PROOF, _proofData, _signatures);
    }

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
        bytes memory _signature
    ) public {
        ( uint8 status, , , ) = ace.getNote(address(this), _noteHash);
        require(status == 1, "only unspent notes can be approved");

        bytes32 signatureHash = keccak256(abi.encodePacked(_signature));
        require(signatureLog[signatureHash] != true, "signature has already been used");
        // Only need to prevent replay from calls where msg.sender isn't owner of note.
        if (_signature.length != 0) {
            signatureLog[signatureHash] = true;
        }

        bytes32 _hashStruct = keccak256(abi.encode(
                NOTE_SIGNATURE_TYPEHASH,
                _noteHash,
                _spender,
                _spenderApproval
        ));

        validateSignature(_hashStruct, _noteHash, _signature);
        confidentialApproved[_noteHash][_spender] = _spenderApproval;
    }

    /**
     * @dev Note owner can approve a third party address, such as a smart contract,
     * to spend a proof on their behalf. This allows a batch approval of notes
     * to be performed, rather than individually for each note via confidentialApprove().
     *
     * @param _proofId - id of proof to be approved. Needs to be a balanced proof.
     * @param _proofOutputs - data of proof
     * @param _spender - address being approved to spend the notes
     * @param _proofSignature - ECDSA signature over the proof, approving it to be spent
     */
    function approveProof(
        uint24 _proofId,
        bytes calldata _proofOutputs,
        address _spender,
        bool _approval,
        bytes calldata _proofSignature
    ) external {
        // Prevent possible replay attacks
        bytes32 signatureHash = keccak256(_proofSignature);
        require(signatureLog[signatureHash] != true, "signature has already been used");
        signatureLog[signatureHash] = true;

        bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("ZK_ASSET"),
            keccak256("1"),
            address(this)
        ));

        bytes32 msgHash = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                PROOF_SIGNATURE_TYPE_HASH,
                keccak256(_proofOutputs),
                _spender,
                _approval
            ))
        ));

        address signer = recoverSignature(
            msgHash,
            _proofSignature
        );

        for (uint i = 0; i < _proofOutputs.getLength(); i += 1) {
            bytes memory proofOutput = _proofOutputs.get(i);

            (bytes memory inputNotes,,,) = proofOutput.extractProofOutput();

            for (uint256 j = 0; j < inputNotes.getLength(); j += 1) {
                (, bytes32 noteHash, ) = inputNotes.get(j).extractNote();
                ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);
                require(status == 1, "only unspent notes can be approved");
                require(noteOwner == signer, "the note owner did not sign this proof");
            }

            confidentialApproved[keccak256(proofOutput)][_spender] = _approval;
        }
    }

    /**
    * @dev Perform ECDSA signature validation for a signature over an input note
    *
    * @param _hashStruct - the data to sign in an EIP712 signature
    * @param _noteHash - keccak256 hash of the note coordinates (gamma and sigma)
    * @param _signature - ECDSA signature for a particular input note
    */
    function validateSignature(
        bytes32 _hashStruct,
        bytes32 _noteHash,
        bytes memory _signature
    ) internal view {
        (, , , address noteOwner ) = ace.getNote(address(this), _noteHash);

        address signer;
        if (_signature.length != 0) {
            // validate EIP712 signature
            bytes32 msgHash = hashEIP712Message(_hashStruct);
            signer = recoverSignature(
                msgHash,
                _signature
            );
        } else {
            signer = msg.sender;
        }
        require(signer == noteOwner, "the note owner did not sign this message");
    }

    /**
    * @dev Extract the appropriate ECDSA signature from an array of signatures,
    *
    * @param _signatures - array of ECDSA signatures over all inputNotes
    * @param _i - index used to determine which signature element is desired
    */
    function extractSignature(bytes memory _signatures, uint _i) internal pure returns (
        bytes memory _signature
    ){
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // memory map of signatures
            // 0x00 - 0x20 : length of signature array
            // 0x20 - 0x40 : first sig, r
            // 0x40 - 0x60 : first sig, s
            // 0x61 - 0x62 : first sig, v
            // 0x62 - 0x82 : second sig, r
            // and so on...
            // Length of a signature = 0x41

            let sigLength := 0x41

            r := mload(add(add(_signatures, 0x20), mul(_i, sigLength)))
            s := mload(add(add(_signatures, 0x40), mul(_i, sigLength)))
            v := mload(add(add(_signatures, 0x41), mul(_i, sigLength)))
        }

        _signature = abi.encodePacked(r, s, v);
    }

    /**
    * @dev Executes a value transfer mediated by smart contracts. The method is supplied with
    * transfer instructions represented by a bytes _proofOutput argument that was outputted
    * from a proof verification contract.
    *
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofOutput - output of a zero-knowledge proof validation contract. Represents
    * transfer instructions for the IACE
    */
    function confidentialTransferFrom(uint24 _proof, bytes memory _proofOutput) public {
        (bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue) = _proofOutput.extractProofOutput();

        bytes32 proofHash = keccak256(_proofOutput);

        if (confidentialApproved[proofHash][msg.sender] != true) {
            uint256 length = inputNotes.getLength();
            for (uint i = 0; i < length; i += 1) {
                (, bytes32 noteHash, ) = inputNotes.get(i).extractNote();
                require(
                    confidentialApproved[noteHash][msg.sender] == true,
                    "sender does not have approval to spend input note"
                );
            }
        }

        ace.updateNoteRegistry(_proof, _proofOutput, msg.sender);

        logInputNotes(inputNotes);
        logOutputNotes(outputNotes);

        if (publicValue < 0) {
            emit ConvertTokens(publicOwner, uint256(-publicValue));
        }
        if (publicValue > 0) {
            emit RedeemTokens(publicOwner, uint256(publicValue));
        }
    }

    /**
    * @dev Internal method to act on transfer instructions from a successful proof validation.
    * Specifically, it:
    * - extracts the relevant objects from the proofOutput object
    * - validates an EIP712 signature over each input note
    * - updates note registry state
    * - emits events for note creation/destruction
    * - converts or redeems tokens, according to the publicValue
    * @param _proofId - id of proof resulting in _proofData
    * @param proofOutputs - transfer instructions from a zero-knowledege proof validator
    * contract
    * @param _signatures - ECDSA signatures over a set of input notes
    * @param _proofData - cryptographic proof data outputted from a proof construction
    * operation
    */
    function confidentialTransferInternal(
        uint24 _proofId,
        bytes memory proofOutputs,
        bytes memory _signatures,
        bytes memory _proofData
    ) internal {
        bytes32 _challenge;
        assembly {
            _challenge := mload(add(_proofData, 0x40))
        }

        for (uint i = 0; i < proofOutputs.getLength(); i += 1) {
            bytes memory proofOutput = proofOutputs.get(i);
            ace.updateNoteRegistry(_proofId, proofOutput, address(this));

            (bytes memory inputNotes,
            bytes memory outputNotes,
            address publicOwner,
            int256 publicValue) = proofOutput.extractProofOutput();


            if (inputNotes.getLength() > uint(0)) {
                for (uint j = 0; j < inputNotes.getLength(); j += 1) {
                    bytes memory _signature = extractSignature(_signatures, j);

                    (, bytes32 noteHash, ) = inputNotes.get(j).extractNote();

                    bytes32 hashStruct = keccak256(abi.encode(
                        JOIN_SPLIT_SIGNATURE_TYPE_HASH,
                        _proofId,
                        noteHash,
                        _challenge,
                        msg.sender
                    ));

                    validateSignature(hashStruct, noteHash, _signature);
                }
            }

            logInputNotes(inputNotes);
            logOutputNotes(outputNotes);
            if (publicValue < 0) {
                emit ConvertTokens(publicOwner, uint256(-publicValue));
            }
            if (publicValue > 0) {
                emit RedeemTokens(publicOwner, uint256(publicValue));
            }

        }
    }

    /**
    * @dev Update the metadata of a note that already exists in storage.
    * @param noteHash - hash of a note, used as a unique identifier for the note
    * @param metaData - metadata to update the note with
    */
    function updateNoteMetaData(bytes32 noteHash, bytes memory metaData) public {
        // Get the note from this assets registry
        ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);

        bytes32 addressID = keccak256(abi.encodePacked(msg.sender, noteHash));
        require(
            (noteAccess[addressID] >= metaDataTimeLog[noteHash] || noteOwner == msg.sender) && status == 1,
            'caller does not have permission to update metaData'
        );

        // Approve the addresses in the note metaData
        approveAddresses(metaData, noteHash);

        // Set the metaDataTimeLog to the latest block time
        setMetaDataTimeLog(noteHash);

        emit UpdateNoteMetaData(noteOwner, noteHash, metaData);
    }

    /**
    * @dev Set the metaDataTimeLog mapping
    * @param noteHash - hash of a note, used as a unique identifier for the note
    */
    function setMetaDataTimeLog(bytes32 noteHash) internal {
        metaDataTimeLog[noteHash] = block.timestamp;
    }

    /**
    * @dev Add approved addresses to a noteAccess mapping and to the global collection of addresses that
    * have been approved
    * @param metaData - metaData of a note, which contains addresses to be approved
    * @param noteHash - hash of an AZTEC note, a unique identifier of the note
    */
    function approveAddresses(bytes memory metaData, bytes32 noteHash) internal {
        /**
        * Memory map of metaData
        * 0x00 - 0x20 : length of metaData
        * 0x20 - 0x81 : ephemeral key
        * 0x81 - 0xa1 : approved addresses offset
        * 0xa1 - 0xc1 : encrypted view keys offset
        * 0xc1 - 0xe1 : app data offset
        * 0xe1 - L_addresses : approvedAddresses
        * (0xe1 + L_addresses) - (0xe1 + L_addresses + L_encryptedViewKeys) : encrypted view keys
        * (0xe1 + L_addresses + L_encryptedViewKeys) - (0xe1 + L_addresses + L_encryptedViewKeys + L_appData) : appData
        */

        bytes32 metaDataLength;
        bytes32 numAddresses;
        assembly {
            metaDataLength := mload(metaData)
            numAddresses := mload(add(metaData, 0xe1))
        }

        // if customData has been set, approve the relevant addresses
        if (uint256(metaDataLength) > 0x61) {
            for (uint256 i = 0; i < uint256(numAddresses); i += 1) {
                address extractedAddress = MetaDataUtils.extractAddress(metaData, i);
                bytes32 addressID = keccak256(abi.encodePacked(extractedAddress, noteHash));
                noteAccess[addressID] = block.timestamp;
            }
        }
    }


    /**
    * @dev Emit events for all input notes, which represent notes being destroyed
    * and removed from the note registry
    *
    * @param inputNotes - input notes being destroyed and removed from note registry state
    */
    function logInputNotes(bytes memory inputNotes) internal {
        for (uint i = 0; i < inputNotes.getLength(); i += 1) {
            (address noteOwner, bytes32 noteHash, ) = inputNotes.get(i).extractNote();
            emit DestroyNote(noteOwner, noteHash);
        }
    }

    /**
    * @dev Emit events for all output notes, which represent notes being created and added
    * to the note registry
    *
    * @param outputNotes - outputNotes being created and added to note registry state
    */
    function logOutputNotes(bytes memory outputNotes) internal {
        for (uint i = 0; i < outputNotes.getLength(); i += 1) {
            (address noteOwner, bytes32 noteHash, bytes memory metaData) = outputNotes.get(i).extractNote();
            setMetaDataTimeLog(noteHash);
            approveAddresses(metaData, noteHash);
            emit CreateNote(noteOwner, noteHash, metaData);
        }
    }
}
