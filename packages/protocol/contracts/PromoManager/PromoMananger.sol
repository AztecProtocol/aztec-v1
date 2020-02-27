

pragma solidity >=0.5.0 <0.6.0;

import "@aztec/protocol/contracts/interfaces/IACE.sol";
import "@aztec/protocol/contracts/interfaces/IZkAsset.sol";
import "@aztec/protocol/contracts/libs/NoteUtils.sol";
import "@aztec/protocol/contracts/AccountRegistry/GSNRecipientTimestampSignature.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";

/**
 * @title InterestPool implementation
 * @author AZTEC
 * Note the behaviour contract version naming convention is based on the date on which the contract
 * was created, in the format: YYYYMMDD
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
contract PromoManager is GSNRecipientTimestampSignature {
    using NoteUtils for bytes;
    using SafeMath for uint256;


    address private _owner;

    mapping(bytes32 => bool) public codeRedemptions;
    mapping(bytes32 => bytes32) public codeToTotalNotes;
    mapping(bytes32 => address) public userCommitToCode;

    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);
    event LogAddress(address conrtrac);
    event LogBytes(bytes32 bb);

    IACE ace;

    uint24 JOIN_SPLIT_PROOF = 65793;

    IZkAsset zkDAI;
    bytes32 unallocatedNoteHash;
    struct Note {
        address owner;
        bytes32 noteHash;
    }
    /**
    * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
    * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    function _noteCoderToStruct(bytes memory note) internal pure returns (Note memory codedNote) {
        (address owner, bytes32 noteHash,) = note.extractNote();
        return Note(owner, noteHash );
    }


    constructor(
        address _aceAddress,
        address _trustedGSNSignerAddress, 
        address _zkDaiAddress
    ) public {

        GSNRecipientTimestampSignature.initialize(_trustedGSNSignerAddress);

        _owner = msg.sender;
        zkDAI = IZkAsset(_zkDaiAddress);
        ace = IACE(_aceAddress);

    }



    function initialize( bytes32 _unallocatedNoteHash) initializer onlyOwner public {
        // make this constant and remove all variables we know before hand in a constructor

        // initialise function should be only owner
        unallocatedNoteHash = _unallocatedNoteHash; // initialise as the zero value note
    }


    /**
    * @dev Sets a mapping of a code hash to a noteHash 
    **/

    function setCodes(bytes32[] memory _codeHashes, bytes memory _proofData) public onlyOwner {
        (bytes memory _proofOutputs) = ace.validateProof(JOIN_SPLIT_PROOF, address(this), _proofData);
        // inputNotes1 is the un allocated balance
        (bytes memory _proofInputNotes, bytes memory _proofOutputNotes, ,) = _proofOutputs.get(0).extractProofOutput();
        for (uint i = 0; i < _codeHashes.length; i += 1) {
            codeToTotalNotes[_codeHashes[i]] = _noteCoderToStruct(_proofOutputNotes.get(i.add(1))).noteHash;
        }
        require(_noteCoderToStruct(_proofInputNotes.get(0)).noteHash == unallocatedNoteHash, 'hash incorrect');

        zkDAI.confidentialApprove(_noteCoderToStruct(_proofInputNotes.get(0)).noteHash, address(this), true, '');
        // zkDAI.confidentialApprove(_noteCoderToStruct(_proofInputNotes.get(0)).noteHash, address(zkDAI), true, '');
        zkDAI.confidentialTransferFrom(JOIN_SPLIT_PROOF, _proofOutputs.get(0));
        unallocatedNoteHash = _noteCoderToStruct(_proofOutputNotes.get(0)).noteHash;
    }

    function claim1(bytes32 _codeHash) public {
        require(address(userCommitToCode[_codeHash]) == address(0));
        userCommitToCode[_codeHash] = _msgSender();
    }

    function claim2(string memory _code, uint256 _challenge, bytes memory _proofData) public {
        bytes32 codeCommitHash = keccak256(abi.encode(_code, _challenge, _msgSender()));
        bytes32 codeHash = keccak256(abi.encode(_code));
        require(userCommitToCode[codeCommitHash] == _msgSender(), 'code');
        require(!codeRedemptions[codeHash], 'code redeemed');
        codeRedemptions[codeHash] = true;

        (bytes memory _proofOutputs) = ace.validateProof(JOIN_SPLIT_PROOF, address(this), _proofData);
        (bytes memory _proofInputNotes, bytes memory _proofOutputNotes, ,) = _proofOutputs.get(0).extractProofOutput();
        // here we cheeck that proof input notes == 
        require(codeToTotalNotes[codeHash] == _noteCoderToStruct(_proofInputNotes.get(0)).noteHash, 'bad note');
        require(_proofInputNotes.getLength() == 1, 'bad length');
        zkDAI.confidentialApprove(codeToTotalNotes[codeHash], address(this), true, '');
        zkDAI.confidentialTransferFrom(JOIN_SPLIT_PROOF, _proofOutputs.get(0));
    }


    /**
     * @dev Emits an event, annoucing that the relayed call has been successfully executed
     * @param context - second argument in the tuple returned by acceptRelayedCall
     * @param success - bool specifying whether the relayed call was successfully executed
     * @param actualCharge - estimate of the transaction gas cost
     * @param preRetVal - the return value of preRelayedCall
     */

    function _postRelayedCall(bytes memory context, bool success, uint256 actualCharge, bytes32 preRetVal) internal {
        (bytes memory approveData) = abi.decode(context, (bytes));
        emit GSNTransactionProcessed(keccak256(approveData), success, actualCharge);
    }


}
