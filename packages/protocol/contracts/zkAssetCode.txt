
// File: openzeppelin-solidity/contracts/math/SafeMath.sol

pragma solidity ^0.5.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     *
     * _Available since v2.4.0._
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// File: contracts/libs/NoteUtils.sol

pragma solidity >=0.5.0 <0.6.0;

/**
 * @title NoteUtils
 * @author AZTEC
 * @dev NoteUtils is a utility library that extracts user-readable information from AZTEC proof outputs.
 *      Specifically, `bytes proofOutput` objects can be extracted from `bytes proofOutputs`,
 *      `bytes proofOutput` and `bytes note` can be extracted into their constituent components,
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
library NoteUtils {

    /**
    * @dev Get the number of entries in an AZTEC-ABI array (bytes proofOutputs, bytes inputNotes, bytes outputNotes)
    *      All 3 are rolled into a single function to eliminate 'wet' code - the implementations are identical
    * @param _proofOutputsOrNotes `proofOutputs`, `inputNotes` or `outputNotes`
    * @return number of entries in the pseudo dynamic array
    */
    function getLength(bytes memory _proofOutputsOrNotes) internal pure returns (
        uint len
    ) {
        assembly {
            // first word = the raw byte length
            // second word = the actual number of entries (hence the 0x20 offset)
            len := mload(add(_proofOutputsOrNotes, 0x20))
        }
    }

    /**
    * @dev Get a bytes object out of a dynamic AZTEC-ABI array
    * @param _proofOutputsOrNotes `proofOutputs`, `inputNotes` or `outputNotes`
    * @param _i the desired entry
    * @return number of entries in the pseudo dynamic array
    */
    function get(bytes memory _proofOutputsOrNotes, uint _i) internal pure returns (
        bytes memory out
    ) {
        bool valid;
        assembly {
            // check that i < the number of entries
            valid := lt(
                _i,
                mload(add(_proofOutputsOrNotes, 0x20))
            )
            // memory map of the array is as follows:
            // 0x00 - 0x20 : byte length of array
            // 0x20 - 0x40 : n, the number of entries
            // 0x40 - 0x40 + (0x20 * i) : relative memory offset to start of i'th entry (i <= n)

            // Step 1: compute location of relative memory offset: _proofOutputsOrNotes + 0x40 + (0x20 * i) 
            // Step 2: loaded relative offset and add to _proofOutputsOrNotes to get absolute memory location
            out := add(
                mload(
                    add(
                        add(_proofOutputsOrNotes, 0x40),
                        mul(_i, 0x20)
                    )
                ),
                _proofOutputsOrNotes
            )
        }
        require(valid, "AZTEC array index is out of bounds");
    }

    /**
    * @dev Extract constituent elements of a `bytes _proofOutput` object
    * @param _proofOutput an AZTEC proof output
    * @return inputNotes, AZTEC-ABI dynamic array of input AZTEC notes
    * @return outputNotes, AZTEC-ABI dynamic array of output AZTEC notes
    * @return publicOwner, the Ethereum address of the owner of any public tokens involved in the proof
    * @return publicValue, the amount of public tokens involved in the proof
    *         if (publicValue > 0), this represents a transfer of tokens from ACE to publicOwner
    *         if (publicValue < 0), this represents a transfer of tokens from publicOwner to ACE
    */
    function extractProofOutput(bytes memory _proofOutput) internal pure returns (
        bytes memory inputNotes,
        bytes memory outputNotes,
        address publicOwner,
        int256 publicValue
    ) {
        assembly {
            // memory map of a proofOutput:
            // 0x00 - 0x20 : byte length of proofOutput
            // 0x20 - 0x40 : relative offset to inputNotes
            // 0x40 - 0x60 : relative offset to outputNotes
            // 0x60 - 0x80 : publicOwner
            // 0x80 - 0xa0 : publicValue
            // 0xa0 - 0xc0 : challenge
            inputNotes := add(_proofOutput, mload(add(_proofOutput, 0x20)))
            outputNotes := add(_proofOutput, mload(add(_proofOutput, 0x40)))
            publicOwner := and(
                mload(add(_proofOutput, 0x60)),
                0xffffffffffffffffffffffffffffffffffffffff
            )
            publicValue := mload(add(_proofOutput, 0x80))
        }
    }

    /**
    * @dev Extract the challenge from a bytes proofOutput variable
    * @param _proofOutput bytes proofOutput, outputted from a proof validation smart contract
    * @return bytes32 challenge - cryptographic variable that is part of the sigma protocol
    */
    function extractChallenge(bytes memory _proofOutput) internal pure returns (
        bytes32 challenge
    ) {
        assembly {
            challenge := mload(add(_proofOutput, 0xa0))
        }
    }

    /**
    * @dev Extract constituent elements of an AZTEC note
    * @param _note an AZTEC note
    * @return owner, Ethereum address of note owner
    * @return noteHash, the hash of the note's public key
    * @return metadata, note-specific metadata (contains public key and any extra data needed by note owner)
    */
    function extractNote(bytes memory _note) internal pure returns (
            address owner,
            bytes32 noteHash,
            bytes memory metadata
    ) {
        assembly {
            // memory map of a note:
            // 0x00 - 0x20 : byte length of note
            // 0x20 - 0x40 : note type
            // 0x40 - 0x60 : owner
            // 0x60 - 0x80 : noteHash
            // 0x80 - 0xa0 : start of metadata byte array
            owner := and(
                mload(add(_note, 0x40)),
                0xffffffffffffffffffffffffffffffffffffffff
            )
            noteHash := mload(add(_note, 0x60))
            metadata := add(_note, 0x80)
        }
    }
    
    /**
    * @dev Get the note type
    * @param _note an AZTEC note
    * @return noteType
    */
    function getNoteType(bytes memory _note) internal pure returns (
        uint256 noteType
    ) {
        assembly {
            noteType := mload(add(_note, 0x20))
        }
    }
}

// File: contracts/interfaces/IACE.sol

pragma solidity >=0.5.0 <0.6.0;

/**
 * @title IACE
 * @author AZTEC
 * @dev Standard defining the interface for ACE.sol
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
contract IACE {

    uint8 public latestEpoch;

    /**
    * @dev Burn AZTEC notes
    *
    * @param _proof the AZTEC proof object
    * @param _proofData the burn proof construction data
    * @param _proofSender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *        an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return two `bytes` objects. The first contains the new confidentialTotalSupply note and the second contains the
    * notes that were created. Returned so that a zkAsset can emit the appropriate events
    */
    function burn(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);


        /**
    * @dev Default noteRegistry creation method. Doesn't take the id of the factory to use,
            but generates it based on defaults and on the passed flags.
    *
    * @param _linkedTokenAddress - address of any erc20 linked token (can not be 0x0 if canConvert is true)
    * @param _scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
    * @param _canAdjustSupply - whether the noteRegistry can make use of minting and burning
    * @param _canConvert - whether the noteRegistry can transfer value from private to public
        representation and vice versa
    */
    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) external;

    /**
    * @dev NoteRegistry creation method. Takes an id of the factory to use.
    *
    * @param _linkedTokenAddress - address of any erc20 linked token (can not be 0x0 if canConvert is true)
    * @param _scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
    * @param _canAdjustSupply - whether the noteRegistry can make use of minting and burning
    * @param _canConvert - whether the noteRegistry can transfer value from private to public
        representation and vice versa
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    */
    function createNoteRegistry(
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert,
        uint24 _factoryId
    ) external;

    /**
    * @dev Clear storage variables set when validating zero-knowledge proofs.
    *      The only address that can clear data from `validatedProofs` is the address that created the proof.
    *      Function is designed to utilize [EIP-1283](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1283.md)
    *      to reduce gas costs. It is highly likely that any storage variables set by `validateProof`
    *      are only required for the duration of a single transaction.
    *      E.g. a decentralized exchange validating a swap proof and sending transfer instructions to
    *      two confidential assets.
    *      This method allows the calling smart contract to recover most of the gas spent by setting `validatedProofs`
    * @param _proof the AZTEC proof object
    * @param _proofHashes dynamic array of proof hashes
    */
    function clearProofByHashes(uint24 _proof, bytes32[] calldata _proofHashes) external;

    /**
    * @dev Returns the common reference string.
    * We use a custom getter for `commonReferenceString` - the default getter created by making the storage
    * variable public indexes individual elements of the array, and we want to return the whole array
    */
    function getCommonReferenceString() external view returns (bytes32[6] memory);


    /**
    * @dev Get the factory address associated with a particular factoryId. Fail if resulting address is 0x0.
    *
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    */
    function getFactoryAddress(uint24 _factoryId) external view returns (address factoryAddress);

    /**
     * @dev Returns the registry for a given address.
     *
     * @param _registryOwner - address of the registry owner in question
     *
     * @return linkedTokenAddress - public ERC20 token that is linked to the NoteRegistry. This is used to
     * transfer public value into and out of the system
     * @return scalingFactor - defines how many ERC20 tokens are represented by one AZTEC note
     * @return totalSupply - represents the total current supply of public tokens associated with a particular registry
     * @return confidentialTotalMinted - keccak256 hash of the note representing the total minted supply
     * @return confidentialTotalBurned - keccak256 hash of the note representing the total burned supply
     * @return canConvert - flag set by the owner to decide whether the registry has public to private, and
     * vice versa, conversion privilege
     * @return canAdjustSupply - determines whether the registry has minting and burning privileges
     */
    function getRegistry(address _registryOwner) external view returns (
        address linkedToken,
        uint256 scalingFactor,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        uint256 totalSupply,
        uint256 totalSupplemented,
        bool canConvert,
        bool canAdjustSupply
    );

    /**
     * @dev Returns the note for a given address and note hash.
     *
     * @param _registryOwner - address of the registry owner
     * @param _noteHash - keccak256 hash of the note coordiantes (gamma and sigma)
     *
     * @return status - status of the note, details whether the note is in a note registry
     * or has been destroyed
     * @return createdOn - time the note was created
     * @return destroyedOn - time the note was destroyed
     * @return noteOwner - address of the note owner
     */
    function getNote(address _registryOwner, bytes32 _noteHash) external view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );

    /**
    * @dev Get the address of the relevant validator contract
    *
    * @param _proof unique identifier of a particular proof
    * @return validatorAddress - the address of the validator contract
    */
    function getValidatorAddress(uint24 _proof) external view returns (address validatorAddress);

    /**
    * @dev Increment the default registry epoch
    */
    function incrementDefaultRegistryEpoch() external;

    /**
     * @dev Increments the `latestEpoch` storage variable.
     */
    function incrementLatestEpoch() external;

    /**
    * @dev Forever invalidate the given proof.
    * @param _proof the AZTEC proof object
    */
    function invalidateProof(uint24 _proof) external;
        
    function isOwner() external view returns (bool);

    /**
    * @dev Mint AZTEC notes
    *
    * @param _proof the AZTEC proof object
    * @param _proofData the mint proof construction data
    * @param _proofSender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *        an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return two `bytes` objects. The first contains the new confidentialTotalSupply note and the second contains the
    * notes that were created. Returned so that a zkAsset can emit the appropriate events
    */
    function mint(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);
    

    function owner() external returns (address);

    /**
    * @dev Adds a public approval record to the noteRegistry, for use by ACE when it needs to transfer
        public tokens it holds to an external address. It needs to be associated with the hash of a proof.
    */
    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) external;


    function renounceOwnership() external;

    /**
    * @dev Set the common reference string.
    *      If the trusted setup is re-run, we will need to be able to change the crs
    * @param _commonReferenceString the new commonReferenceString
    */
    function setCommonReferenceString(bytes32[6] calldata _commonReferenceString) external;

    /**
    * @dev Set the default crypto system to be used
    * @param _defaultCryptoSystem - default crypto system identifier
    */
    function setDefaultCryptoSystem(uint8 _defaultCryptoSystem) external;

    /**
    * @dev Register a new Factory, iff no factory for that ID exists.
            The epoch of any new factory must be at least as big as
            the default registry epoch. Each asset type for each cryptosystem for
            each epoch should have a note registry
    *
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    * @param _factoryAddress - address of the deployed factory
    */
    function setFactory(uint24 _factoryId, address _factoryAddress) external;

    /**
    * @dev Adds or modifies a proof into the Cryptography Engine.
    *       This method links a given `_proof` to a smart contract validator.
    * @param _proof the AZTEC proof object
    * @param _validatorAddress the address of the smart contract validator
    */
    function setProof(
        uint24 _proof,
        address _validatorAddress
    ) external;

    /**
    * @dev called when a mintable and convertible asset wants to perform an
            action which puts the zero-knowledge and public
            balance out of balance. For example, if minting in zero-knowledge, some
            public tokens need to be added to the pool
            managed by ACE, otherwise any private->public conversion runs the risk of not
            having any public tokens to send.
    *
    * @param _value the value to be added
    */
    function supplementTokens(uint256 _value) external;

    function transferOwnership(address newOwner) external;


    /**
    * @dev Validate an AZTEC zero-knowledge proof. ACE will issue a validation transaction to the smart contract
    *      linked to `_proof`. The validator smart contract will have the following interface:
    *
    *      function validate(
    *          bytes _proofData,
    *          address _sender,
    *          bytes32[6] _commonReferenceString
    *      ) public returns (bytes)
    *
    * @param _proof the AZTEC proof object
    * @param _sender the Ethereum address of the original transaction sender. It is explicitly assumed that
    *        an asset using ACE supplies this field correctly - if they don't their asset is vulnerable to front-running
    * Unnamed param is the AZTEC zero-knowledge proof data
    * @return a `bytes proofOutputs` variable formatted according to the Cryptography Engine standard
    */
    function validateProof(uint24 _proof, address _sender, bytes calldata) external returns (bytes memory);

    /**
    * @dev Validate a previously validated AZTEC proof via its hash
    *      This enables confidential assets to receive transfer instructions from a dApp that
    *      has already validated an AZTEC proof that satisfies a balancing relationship.
    * @param _proof the AZTEC proof object
    * @param _proofHash the hash of the `proofOutput` received by the asset
    * @param _sender the Ethereum address of the contract issuing the transfer instruction
    * @return a boolean that signifies whether the corresponding AZTEC proof has been validated
    */
    function validateProofByHash(uint24 _proof, bytes32 _proofHash, address _sender) external view returns (bool);

    /**
    * @dev Method to upgrade the registry linked with the msg.sender to a new factory, based on _factoryId.
    * The submitted _factoryId must be of epoch equal or greater than previous _factoryId, and of the same assetType.
    *
    * @param _factoryId - uint24 which contains 3 uint8s representing (epoch, cryptoSystem, assetType)
    */
    function upgradeNoteRegistry(uint24 _factoryId) external;

    /**
    * @dev Update the state of the note registry according to transfer instructions issued by a
    * zero-knowledge proof. This method will verify that the relevant proof has been validated,
    * make sure the same proof has can't be re-used, and it then delegates to the relevant noteRegistry.
    *
    * @param _proof - unique identifier for a proof
    * @param _proofOutput - transfer instructions issued by a zero-knowledge proof
    * @param _proofSender - address of the entity sending the proof
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes calldata _proofOutput,
        address _proofSender
    ) external;


    event SetCommonReferenceString(bytes32[6] _commonReferenceString);
    
    event SetProof(
        uint8 indexed epoch,
        uint8 indexed category,
        uint8 indexed id,
        address validatorAddress
    );

    event IncrementLatestEpoch(uint8 newLatestEpoch);

    event SetFactory(
        uint8 indexed epoch,
        uint8 indexed cryptoSystem,
        uint8 indexed assetType,
        address factoryAddress
    );

    event CreateNoteRegistry(
        address registryOwner,
        address registryAddress,
        uint256 scalingFactor,
        address linkedTokenAddress,
        bool canAdjustSupply,
        bool canConvert
    );

    event UpgradeNoteRegistry(
        address registryOwner,
        address proxyAddress,
        address newBehaviourAddress
    );
    
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: contracts/interfaces/IAZTEC.sol

pragma solidity >=0.5.0 <0.6.0;

/**
 * @title IAZTEC
 * @author AZTEC
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
contract IAZTEC {
    enum ProofCategory {
        NULL,
        BALANCED,
        MINT,
        BURN,
        UTILITY
    }

    enum NoteStatus {
        DOES_NOT_EXIST,
        UNSPENT,
        SPENT
    }
    // proofEpoch = 1 | proofCategory = 1 | proofId = 1
    // 1 * 256**(2) + 1 * 256**(1) ++ 1 * 256**(0)
    uint24 public constant JOIN_SPLIT_PROOF = 65793;

    // proofEpoch = 1 | proofCategory = 2 | proofId = 1
    // (1 * 256**(2)) + (2 * 256**(1)) + (1 * 256**(0))
    uint24 public constant MINT_PROOF = 66049;

    // proofEpoch = 1 | proofCategory = 3 | proofId = 1
    // (1 * 256**(2)) + (3 * 256**(1)) + (1 * 256**(0))
    uint24 public constant BURN_PROOF = 66305;

    // proofEpoch = 1 | proofCategory = 4 | proofId = 2
    // (1 * 256**(2)) + (4 * 256**(1)) + (2 * 256**(0))
    uint24 public constant PRIVATE_RANGE_PROOF = 66562;

        // proofEpoch = 1 | proofCategory = 4 | proofId = 3
    // (1 * 256**(2)) + (4 * 256**(1)) + (2 * 256**(0))
    uint24 public constant PUBLIC_RANGE_PROOF = 66563;

    // proofEpoch = 1 | proofCategory = 4 | proofId = 1
    // (1 * 256**(2)) + (4 * 256**(1)) + (2 * 256**(0))
    uint24 public constant DIVIDEND_PROOF = 66561;
}

// File: contracts/interfaces/IZkAsset.sol

pragma solidity >=0.5.0 <0.6.0;

/**
 * @title IZkAsset
 * @author AZTEC
 * @dev An interface defining the ZkAsset standard
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

interface IZkAsset {

    /**
     * @dev Note owner can approve a third party address, such as a smart contract,
     * to spend multiple notes on their behalf. This allows a batch approval of notes
     * to be performed, rather than individually for each note via confidentialApprove().
     *
    * @param _proofId - data of proof
     * @param _proofOutputs - data of proof
     * @param _spender - address being approved to spend the notes
     * @param _approval - bool (true if approving, false if revoking)
     * @param _proofSignature - ECDSA signature over the proof, approving it to be spent
     */
    function approveProof(
        uint24 _proofId,
        bytes calldata _proofOutputs,
        address _spender,
        bool _approval,
        bytes calldata _proofSignature
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
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofOutput - output of a zero-knowledge proof validation contract. Represents
    * transfer instructions for the ACE
    */
    function confidentialTransferFrom(uint24 _proof, bytes calldata _proofOutput) external;


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


    /**
    * @dev Extract a single approved address from the metaData
    * @param metaData - metaData containing addresses according to the schema defined in x
    * @param addressPos - indexer for the desired address, the one to be extracted
    * @return desiredAddress - extracted address specified by the inputs to this function
    */
    function extractAddress(bytes calldata metaData, uint256 addressPos) external returns (address desiredAddress);

    /**
    * @dev Update the metadata of a note that already exists in storage.
    * @param noteHash - hash of a note, used as a unique identifier for the note
    * @param metaData - metadata to update the note with
    */
    function updateNoteMetaData(bytes32 noteHash, bytes calldata metaData) external;

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

// File: contracts/interfaces/IERC20Mintable.sol

pragma solidity >=0.5.0 <0.6.0;


/**
 * @title IERC20Mintable
 * @dev Interface for ERC20 with minting function
 * Sourced from OpenZeppelin 
 * (https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/IERC20.sol) 
 * and with an added mint() function. The mint function is necessary because a ZkAssetMintable 
 * may need to be able to mint from the linked note registry token. This need arises when the 
 * total supply does not meet the extracted value
 * (due to having called confidentialMint())
 */
interface IERC20Mintable {

    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);
    
    function mint(address _to, uint256 _value) external returns (bool);   


    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: contracts/libs/LibEIP712.sol

pragma solidity >=0.5.0 <0.6.0;


/**
 * @title Library of EIP712 utility constants and functions
 * @author AZTEC
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
contract LibEIP712 {

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "AZTEC_CRYPTOGRAPHY_ENGINE";

    // EIP712 Domain Version value
    string constant internal EIP712_DOMAIN_VERSION = "1";

    // Hash of the EIP712 Domain Separator Schema
    bytes32 constant internal EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(abi.encodePacked(
        "EIP712Domain(",
            "string name,",
            "string version,",
            "address verifyingContract",
        ")"
    ));

    // Hash of the EIP712 Domain Separator data
    // solhint-disable-next-line var-name-mixedcase
    bytes32 public EIP712_DOMAIN_HASH;

    constructor ()
        public
    {
        EIP712_DOMAIN_HASH = keccak256(abi.encode(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            address(this)
        ));
    }

    /// @dev Calculates EIP712 encoding for a hash struct in this EIP712 Domain.
    /// @param _hashStruct The EIP712 hash struct.  
    /// @return EIP712 hash applied to this EIP712 Domain.
    function hashEIP712Message(bytes32 _hashStruct)
        internal
        view
        returns (bytes32 _result)
    {
        bytes32 eip712DomainHash = EIP712_DOMAIN_HASH;

        // Assembly for more efficient computing:
        // keccak256(abi.encodePacked(
        //     EIP191_HEADER,
        //     EIP712_DOMAIN_HASH,
        //     hashStruct
        // ));

        assembly {
            // Load free memory pointer. We're not going to use it - we're going to overwrite it!
            // We need 0x60 bytes of memory for this hash,
            // cheaper to overwrite the free memory pointer at 0x40, and then replace it, than allocating free memory
            let memPtr := mload(0x40)
            mstore(0x00, 0x1901)               // EIP191 header
            mstore(0x20, eip712DomainHash)     // EIP712 domain hash
            mstore(0x40, _hashStruct)          // Hash of struct
            _result := keccak256(0x1e, 0x42)   // compute hash
            // replace memory pointer
            mstore(0x40, memPtr)
        }
    }

    /// @dev Extracts the address of the signer with ECDSA.
    /// @param _message The EIP712 message.
    /// @param _signature The ECDSA values, v, r and s.
    /// @return The address of the message signer.
    function recoverSignature(
        bytes32 _message,
        bytes memory _signature
    ) internal view returns (address _signer) {
        bool result;
        assembly {
            // Here's a little trick we can pull. We expect `_signature` to be a byte array, of length 0x60, with
            // 'v', 'r' and 's' located linearly in memory. Preceeding this is the length parameter of `_signature`.
            // We *replace* the length param with the signature msg to get a memory block formatted for the precompile
            // load length as a temporary variable

            let byteLength := mload(_signature)

            // store the signature message
            mstore(_signature, _message)

            // load 'v' - we need it for a condition check
            // add 0x60 to jump over 3 words - length of bytes array, r and s
            let v := mload(add(_signature, 0x60))
            v := shr(248, v) // bitshifting, to resemble padLeft

            /**
            * Original memory map for input to precompile
            *
            * _signature : _signature + 0x20            message 
            * _signature + 0x20 : _signature + 0x40     r
            * _signature + 0x40 : _signature + 0x60     s
            * _signature + 0x60 : _signature + 0x80     v

            * Desired memory map for input to precompile
            *
            * _signature : _signature + 0x20            message 
            * _signature + 0x20 : _signature + 0x40     v
            * _signature + 0x40 : _signature + 0x60     r
            * _signature + 0x60 : _signature + 0x80     s
            */

            // move s to v position
            mstore(add(_signature, 0x60), mload(add(_signature, 0x40)))
            // move r to s position
            mstore(add(_signature, 0x40), mload(add(_signature, 0x20)))
            // move v to r position
            mstore(add(_signature, 0x20), v)
            result := and(
                and(
                    // validate signature length == 0x41
                    eq(byteLength, 0x41),
                    // validate v == 27 or v == 28
                    or(eq(v, 27), eq(v, 28))
                ),
                // validate call to precompile succeeds
                staticcall(gas, 0x01, _signature, 0x80, _signature, 0x20) 
            )
            // save the _signer only if the first word in _signature is not `_message` anymore
            switch eq(_message, mload(_signature))
            case 0 {
                _signer := mload(_signature)
            }
            mstore(_signature, byteLength) // and put the byte length back where it belongs
        }
        // wrap Failure States in a single if test, so that happy path only has 1 conditional jump
        if (!(result && (_signer != address(0x0)))) {
            require(_signer != address(0x0), "signer address cannot be 0");
            require(result, "signature recovery failed");
        }
    }
}

// File: contracts/libs/MetaDataUtils.sol

pragma solidity >=0.5.0 <= 0.6.0;

/**
 * @title MetaDataUtils
 * @author AZTEC
 * @dev Library of MetaData manipulation operations
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

contract MetaDataUtils {
    /**
    * @dev Extract a single approved address from the metaData
    * @param metaData - metaData containing addresses according to the schema defined in x
    * @param addressPos - indexer for the desired address, the one to be extracted
    * @return desiredAddress - extracted address specified by the inputs to this function
    */
    function extractAddress(bytes memory metaData, uint256 addressPos) public returns (address desiredAddress) {
        /**
        * Memory map of metaData. This is the ABI encoding of metaData, supplied by the client
        * The first word of any dynamic bytes array within this map, is the number of discrete elements in that 
        * bytes array. e.g. first word at 0xe1 is the number of approvedAddresses
        * 0x00 - 0x20 : length of metaData
        * 0x20 - 0x81 : ephemeral key
        * 0x81 - 0xa1 : approved addresses offset
        * 0xa1 - 0xc1 : encrypted view keys offset
        * 0xc1 - 0xe1 : app data offset
        * 0xe1 - L_addresses : approvedAddresses
        * (0xe1 + L_addresses) - (0xe1 + L_addresses + L_encryptedViewKeys) : encrypted view keys
        * (0xe1 + L_addresses + L_encryptedViewKeys) - (0xe1 + L_addresses + L_encryptedViewKeys + L_appData) : appData
        */

        uint256 numAddresses;
        assembly {
            numAddresses := mload(add(metaData, 0x20))
            desiredAddress := mload(
                add(
                    add(
                        metaData,
                        add(0xe1, 0x20)  // go to the start of addresses, jump over first word
                    ),
                    mul(addressPos, 0x20) // jump to the desired address
                )
            )
        }

        require(
            addressPos < numAddresses, 
            'addressPos out of bounds - addressPos must be less than the number of addresses to be approved'
        );
    }
}

// File: contracts/libs/ProofUtils.sol

pragma solidity >= 0.5.0 <0.6.0;

/**
 * @title ProofUtils
 * @author AZTEC
 * @dev Library of proof utility functions
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
library ProofUtils {

    /**
     * @dev We compress three uint8 numbers into only one uint24 to save gas.
     * Reverts if the category is not one of [1, 2, 3, 4].
     * @param proof The compressed uint24 number.
     * @return A tuple (uint8, uint8, uint8) representing the epoch, category and proofId.
     */
    function getProofComponents(uint24 proof) internal pure returns (uint8 epoch, uint8 category, uint8 id) {
        assembly {
            id := and(proof, 0xff)
            category := and(div(proof, 0x100), 0xff)
            epoch := and(div(proof, 0x10000), 0xff)
        }
        return (epoch, category, id);
    }
}

// File: contracts/ERC1724/base/ZkAssetBase.sol

pragma solidity >=0.5.0 <0.6.0;










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
contract ZkAssetBase is IZkAsset, IAZTEC, LibEIP712, MetaDataUtils {
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
        signatureLog[signatureHash] = true;

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
            address[] memory extractedAddresses = new address[](uint256(numAddresses));

            for (uint256 i = 0; i < uint256(numAddresses); i += 1) {
                address extractedAddress = extractAddress(metaData, i);
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

// File: contracts/ERC1724/ZkAssetDetailed.sol

pragma solidity >=0.5.0 <0.6.0;


/**
 * @title ZkAssetDetailed implementation that inherits from ZkAsset
 * @author AZTEC
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
contract ZkAssetDetailed is ZkAssetBase {

    string public name;
    string public symbol;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        string memory _name,
        string memory _symbol
    ) public ZkAssetBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        false // canAdjustSupply
    ) {
        name = _name;
        symbol = _symbol;
    }
}
